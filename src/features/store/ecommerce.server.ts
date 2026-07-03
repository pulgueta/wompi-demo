import { randomUUID } from "node:crypto"

import { auth, clerkClient } from "@clerk/tanstack-react-start/server"
import { WompiClient } from "@pulgueta/wompi"
import { getSignatureKey } from "@pulgueta/wompi/server"
import { desc, eq, inArray } from "drizzle-orm"

import { db, ensureDatabaseReady } from "@/db/client.server"
import { orderItems, orders, products, users } from "@/db/schema"
import type { Order, OrderItem, Product, User } from "@/db/schema"

export type StoreUser = Pick<User, "id" | "email" | "name">

export type RecentOrder = Pick<
  Order,
  | "id"
  | "amountInCents"
  | "currency"
  | "status"
  | "wompiCheckoutUrl"
  | "wompiError"
  | "wompiPaymentLinkId"
  | "wompiReference"
  | "createdAt"
> & {
  items: Array<Pick<OrderItem, "productName" | "quantity" | "unitPriceInCents">>
}

export type StorefrontData = {
  currentUser: StoreUser | null
  products: Product[]
  recentOrders: RecentOrder[]
  wompiConfigured: boolean
}

type CheckoutItem = {
  productId: string
  quantity: number
}

type CreateCheckoutInput = {
  customerName: string
  customerEmail: string
  items: CheckoutItem[]
  redirectUrl: string
}

export type CheckoutResult = {
  orderId: string
  checkoutUrl: string | null
  message: string
  status: Order["status"]
}

export async function getStorefrontData(): Promise<StorefrontData> {
  await ensureDatabaseReady()

  const currentUser = await getCurrentUser()
  const [storeProducts, recentOrders] = await Promise.all([
    listProducts(),
    currentUser ? listRecentOrders(currentUser.id) : Promise.resolve([]),
  ])

  return {
    currentUser,
    products: storeProducts,
    recentOrders,
    wompiConfigured: isWompiConfigured(),
  }
}

export async function createCheckout(
  input: CreateCheckoutInput
): Promise<CheckoutResult> {
  await ensureDatabaseReady()

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw new Error("Please sign in before creating an order.")
  }

  const normalizedItems = input.items.filter((item) => item.quantity > 0)
  if (normalizedItems.length === 0) {
    throw new Error("Add at least one product before checkout.")
  }

  const selectedProducts = await db
    .select()
    .from(products)
    .where(
      inArray(
        products.id,
        normalizedItems.map((item) => item.productId)
      )
    )

  if (selectedProducts.length !== normalizedItems.length) {
    throw new Error("One or more products are no longer available.")
  }

  const quantityByProductId = new Map(
    normalizedItems.map((item) => [item.productId, item.quantity])
  )

  const orderLines = selectedProducts.map((product) => {
    const quantity = quantityByProductId.get(product.id) ?? 0
    if (quantity > product.inventory) {
      throw new Error(
        `${product.name} only has ${product.inventory} available.`
      )
    }

    return {
      product,
      quantity,
      lineTotal: product.priceInCents * quantity,
    }
  })

  const amountInCents = orderLines.reduce(
    (total, line) => total + line.lineTotal,
    0
  )
  const now = Date.now()
  const orderId = randomUUID()
  const wompiReference = `wompi-demo-${orderId}`

  await db.insert(orders).values({
    id: orderId,
    userId: currentUser.id,
    status: "pending",
    amountInCents,
    currency: "COP",
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    wompiReference,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(orderItems).values(
    orderLines.map((line) => ({
      id: randomUUID(),
      orderId,
      productId: line.product.id,
      productName: line.product.name,
      unitPriceInCents: line.product.priceInCents,
      quantity: line.quantity,
      createdAt: now,
    }))
  )

  const wompi = createWompiClient()
  if (!wompi.ok) {
    await markOrderConfigurationError(orderId, wompi.message)
    return {
      orderId,
      checkoutUrl: null,
      message: wompi.message,
      status: "configuration_error",
    }
  }

  const integrityKey = process.env.WOMPI_INTEGRITY_KEY
  const signature = integrityKey
    ? await getSignatureKey({
        reference: wompiReference,
        amountInCents,
        integrityKey,
      })
    : undefined

  const [error, paymentLink] =
    await wompi.client.paymentLinks.createPaymentLink({
      name: `Order ${orderId.slice(0, 8)}`,
      description: orderLines
        .map((line) => `${line.quantity} x ${line.product.name}`)
        .join(", "),
      single_use: true,
      collect_shipping: false,
      collect_customer_legal_id: false,
      amount_in_cents: amountInCents,
      currency: "COP",
      reference: wompiReference,
      signature,
      redirect_url: input.redirectUrl,
      customer_data: {
        customer_references: [
          {
            label: "Order reference",
            is_required: false,
          },
        ],
      },
    })

  if (error) {
    await markOrderConfigurationError(orderId, error.message)
    return {
      orderId,
      checkoutUrl: null,
      message: error.message,
      status: "configuration_error",
    }
  }

  await db
    .update(orders)
    .set({
      status: "payment_link_created",
      wompiPaymentLinkId: paymentLink.id,
      wompiCheckoutUrl: paymentLink.checkout_url ?? null,
      updatedAt: Date.now(),
    })
    .where(eq(orders.id, orderId))

  return {
    orderId,
    checkoutUrl: paymentLink.checkout_url ?? null,
    message: "Wompi payment link created.",
    status: "payment_link_created",
  }
}

async function getCurrentUser(): Promise<StoreUser | null> {
  const session = await auth()
  if (!session.userId) {
    return null
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, session.userId),
  })

  const clerkUser = await clerkClient().users.getUser(session.userId)
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses.at(0)?.emailAddress ??
    `${session.userId}@example.invalid`
  const name =
    clerkUser.fullName ??
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ??
    "Demo customer"
  const now = Date.now()

  if (existingUser) {
    await db
      .update(users)
      .set({ email, name, updatedAt: now })
      .where(eq(users.id, existingUser.id))

    return { id: existingUser.id, email, name }
  }

  const userId = randomUUID()
  await db.insert(users).values({
    id: userId,
    clerkUserId: session.userId,
    email,
    name,
    createdAt: now,
    updatedAt: now,
  })

  return { id: userId, email, name }
}

async function listProducts() {
  return await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.name)
}

async function listRecentOrders(userId: string): Promise<RecentOrder[]> {
  const storeOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: desc(orders.createdAt),
    limit: 4,
    with: {
      items: {
        columns: {
          productName: true,
          quantity: true,
          unitPriceInCents: true,
        },
      },
    },
  })

  return storeOrders.map((order) => ({
    id: order.id,
    amountInCents: order.amountInCents,
    currency: order.currency,
    status: order.status,
    wompiCheckoutUrl: order.wompiCheckoutUrl,
    wompiError: order.wompiError,
    wompiPaymentLinkId: order.wompiPaymentLinkId,
    wompiReference: order.wompiReference,
    createdAt: order.createdAt,
    items: order.items,
  }))
}

function createWompiClient():
  { ok: true; client: WompiClient } | { ok: false; message: string } {
  const publicKey = process.env.WOMPI_PUBLIC_KEY
  const privateKey = process.env.WOMPI_PRIVATE_KEY

  if (!publicKey || !privateKey) {
    return {
      ok: false,
      message:
        "Set WOMPI_PUBLIC_KEY and WOMPI_PRIVATE_KEY to create hosted payment links.",
    }
  }

  return {
    ok: true,
    client: new WompiClient({
      publicKey,
      privateKey,
      sandbox: process.env.WOMPI_SANDBOX !== "false",
    }),
  }
}

function isWompiConfigured() {
  return Boolean(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_PRIVATE_KEY)
}

async function markOrderConfigurationError(orderId: string, message: string) {
  await db
    .update(orders)
    .set({
      status: "configuration_error",
      wompiError: message,
      updatedAt: Date.now(),
    })
    .where(eq(orders.id, orderId))
}
