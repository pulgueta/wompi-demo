import { randomUUID } from "node:crypto"

import { auth, clerkClient } from "@clerk/tanstack-react-start/server"
import {
  buildCheckoutUrl,
  isTransactionUpdatedEvent,
  verifyWebhookEvent,
} from "@pulgueta/wompi/server"
import { desc, eq, inArray } from "drizzle-orm"

import { db, ensureDatabaseReady } from "@/db/client.server"
import {
  checkoutSessionItems,
  checkoutSessions,
  orderItems,
  orders,
  products,
  users,
} from "@/db/schema"
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
  | "wompiReference"
  | "wompiTransactionId"
  | "createdAt"
> & {
  items: Array<Pick<OrderItem, "productName" | "quantity" | "unitPriceInCents">>
}

export type StorefrontData = {
  products: Product[]
  wompiConfigured: boolean
}

export type CheckoutData = StorefrontData & {
  currentUser: StoreUser | null
}

export type OrderHistoryData = {
  currentUser: StoreUser | null
  orders: RecentOrder[]
}

type CheckoutItem = {
  productId: string
  quantity: number
}

type CreateCheckoutInput = {
  customerName: string
  customerEmail: string
  customerPhone: string
  legalIdType: "CC" | "CE" | "NIT" | "PP" | "TI"
  legalId: string
  shippingAddressLine1: string
  shippingAddressLine2?: string
  shippingCity: string
  shippingRegion: string
  shippingPostalCode?: string
  items: CheckoutItem[]
  redirectUrl: string
}

export type CheckoutResult = {
  checkoutUrl: string | null
  reference: string | null
  message: string
}

type WompiTransactionStatus =
  "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | "VOIDED"

export async function getStorefrontData(): Promise<StorefrontData> {
  await ensureDatabaseReady()

  const storeProducts = await listProducts()

  return {
    products: storeProducts,
    wompiConfigured: isWompiConfigured(),
  }
}

export async function getCheckoutData(): Promise<CheckoutData> {
  await ensureDatabaseReady()

  const [currentUser, storeProducts] = await Promise.all([
    getCurrentUser(),
    listProducts(),
  ])

  return {
    currentUser,
    products: storeProducts,
    wompiConfigured: isWompiConfigured(),
  }
}

export async function getOrderHistoryData(): Promise<OrderHistoryData> {
  await ensureDatabaseReady()

  const currentUser = await getCurrentUser()

  return {
    currentUser,
    orders: currentUser ? await listRecentOrders(currentUser.id) : [],
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
  const wompiConfiguration = getWompiCheckoutConfiguration()
  if (!wompiConfiguration.ok) {
    return {
      checkoutUrl: null,
      reference: null,
      message: wompiConfiguration.message,
    }
  }

  const now = Date.now()
  const checkoutSessionId = randomUUID()
  const wompiReference = `wompi-demo-${checkoutSessionId}`

  try {
    const checkoutUrl = await buildCheckoutUrl({
      publicKey: wompiConfiguration.publicKey,
      integrityKey: wompiConfiguration.integrityKey,
      reference: wompiReference,
      amountInCents,
      currency: "COP",
      redirectUrl: input.redirectUrl,
      collectShipping: true,
      customerData: {
        email: input.customerEmail,
        fullName: input.customerName,
        phoneNumber: input.customerPhone,
        phoneNumberPrefix: "+57",
        legalId: input.legalId,
        legalIdType: input.legalIdType,
      },
    })

    await db.insert(checkoutSessions).values({
      id: checkoutSessionId,
      userId: currentUser.id,
      amountInCents,
      currency: "COP",
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      legalIdType: input.legalIdType,
      legalId: input.legalId,
      shippingAddressLine1: input.shippingAddressLine1,
      shippingAddressLine2: input.shippingAddressLine2 ?? null,
      shippingCity: input.shippingCity,
      shippingRegion: input.shippingRegion,
      shippingPostalCode: input.shippingPostalCode ?? null,
      wompiReference,
      wompiCheckoutUrl: checkoutUrl,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(checkoutSessionItems).values(
      orderLines.map((line) => ({
        id: randomUUID(),
        checkoutSessionId,
        productId: line.product.id,
        productName: line.product.name,
        unitPriceInCents: line.product.priceInCents,
        quantity: line.quantity,
        createdAt: now,
      }))
    )

    return {
      checkoutUrl,
      reference: wompiReference,
      message: "Checkout created. Redirecting to Wompi.",
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create checkout."
    return {
      checkoutUrl: null,
      reference: wompiReference,
      message,
    }
  }
}

export async function processWompiWebhook(rawBody: string) {
  await ensureDatabaseReady()

  const eventsKey = process.env.WOMPI_EVENTS_KEY
  if (!eventsKey) {
    return {
      ok: false,
      status: 500,
      message: "Set WOMPI_EVENTS_KEY to verify Wompi webhook events.",
    }
  }

  const [error, event] = await verifyWebhookEvent(rawBody, { eventsKey })
  if (error) {
    return {
      ok: false,
      status: 403,
      message: error.message,
    }
  }

  if (!isTransactionUpdatedEvent(event)) {
    return {
      ok: true,
      status: 200,
      message: "Ignored unsupported Wompi event.",
    }
  }

  const transaction = event.data.transaction
  const status = mapWompiStatus(transaction.status)
  const now = Date.now()
  const existingOrder = await db.query.orders.findFirst({
    where: eq(orders.wompiReference, transaction.reference),
  })

  if (existingOrder) {
    await db
      .update(orders)
      .set({
        status,
        amountInCents:
          transaction.amount_in_cents ?? existingOrder.amountInCents,
        customerEmail:
          transaction.customer_email ?? existingOrder.customerEmail,
        currency: transaction.currency ?? existingOrder.currency,
        wompiError: transaction.status_message ?? null,
        wompiPaymentMethodType:
          transaction.payment_method_type ??
          existingOrder.wompiPaymentMethodType,
        wompiTransactionId: transaction.id,
        updatedAt: now,
      })
      .where(eq(orders.id, existingOrder.id))

    return {
      ok: true,
      status: 200,
      message: "Order status updated.",
    }
  }

  const checkoutSession = await db.query.checkoutSessions.findFirst({
    where: eq(checkoutSessions.wompiReference, transaction.reference),
    with: {
      items: {
        columns: {
          productId: true,
          productName: true,
          quantity: true,
          unitPriceInCents: true,
        },
      },
    },
  })

  if (!checkoutSession) {
    return {
      ok: true,
      status: 200,
      message: "No matching checkout session found.",
    }
  }

  const orderId = randomUUID()
  await db.insert(orders).values({
    id: orderId,
    userId: checkoutSession.userId,
    status,
    amountInCents: transaction.amount_in_cents ?? checkoutSession.amountInCents,
    currency: transaction.currency ?? "COP",
    customerEmail: transaction.customer_email ?? checkoutSession.customerEmail,
    customerName: checkoutSession.customerName,
    customerPhone: checkoutSession.customerPhone,
    legalIdType: checkoutSession.legalIdType,
    legalId: checkoutSession.legalId,
    shippingAddressLine1:
      transaction.shipping_address?.address_line_1 ??
      checkoutSession.shippingAddressLine1,
    shippingAddressLine2:
      transaction.shipping_address?.address_line_2 ??
      checkoutSession.shippingAddressLine2,
    shippingCity:
      transaction.shipping_address?.city ?? checkoutSession.shippingCity,
    shippingRegion:
      transaction.shipping_address?.region ?? checkoutSession.shippingRegion,
    shippingPostalCode:
      transaction.shipping_address?.postal_code ??
      checkoutSession.shippingPostalCode,
    wompiReference: transaction.reference,
    wompiCheckoutUrl: checkoutSession.wompiCheckoutUrl,
    wompiError: transaction.status_message ?? null,
    wompiPaymentMethodType: transaction.payment_method_type ?? null,
    wompiTransactionId: transaction.id,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(orderItems).values(
    checkoutSession.items.map((item) => ({
      id: randomUUID(),
      orderId,
      productId: item.productId,
      productName: item.productName,
      unitPriceInCents: item.unitPriceInCents,
      quantity: item.quantity,
      createdAt: now,
    }))
  )

  await db
    .delete(checkoutSessions)
    .where(eq(checkoutSessions.id, checkoutSession.id))

  return {
    ok: true,
    status: 200,
    message: "Order created from webhook.",
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
  const nameFromParts = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ")
  const name = (clerkUser.fullName ?? nameFromParts) || "Demo customer"
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
    wompiReference: order.wompiReference,
    wompiTransactionId: order.wompiTransactionId,
    createdAt: order.createdAt,
    items: order.items,
  }))
}

function getWompiCheckoutConfiguration():
  | { ok: true; publicKey: string; integrityKey: string }
  | { ok: false; message: string } {
  const publicKey = process.env.WOMPI_PUBLIC_KEY
  const integrityKey = process.env.WOMPI_INTEGRITY_KEY

  if (!publicKey || !integrityKey) {
    return {
      ok: false,
      message:
        "Set WOMPI_PUBLIC_KEY and WOMPI_INTEGRITY_KEY to redirect customers to Wompi checkout.",
    }
  }

  return {
    ok: true,
    publicKey,
    integrityKey,
  }
}

function isWompiConfigured() {
  return Boolean(
    process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_INTEGRITY_KEY
  )
}

function mapWompiStatus(status: WompiTransactionStatus): Order["status"] {
  switch (status) {
    case "APPROVED":
      return "approved"
    case "DECLINED":
      return "declined"
    case "ERROR":
      return "error"
    case "VOIDED":
      return "voided"
    case "PENDING":
      return "pending"
  }
}
