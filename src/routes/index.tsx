import { useReducer, useTransition } from "react"
import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { Button } from "@/components/ui/button"
import { CheckoutPanel } from "@/features/store/checkout-panel"
import {
  createWompiCheckout,
  getStorefront,
} from "@/features/store/ecommerce.functions"
import type {
  CheckoutResult,
  StoreUser,
} from "@/features/store/ecommerce.server"
import { ProductGrid } from "@/features/store/product-grid"
import { RecentOrders } from "@/features/store/recent-orders"

export const Route = createFileRoute("/")({
  loader: () => getStorefront(),
  component: Storefront,
})

type StorefrontState = {
  quantities: Record<string, number>
  customerName: string
  customerEmail: string
  checkoutResult: CheckoutResult | null
  checkoutError: string | null
}

type StorefrontAction =
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "setCustomerName"; value: string }
  | { type: "setCustomerEmail"; value: string }
  | { type: "startCheckout" }
  | { type: "checkoutSuccess"; result: CheckoutResult }
  | { type: "checkoutError"; message: string }

function Storefront() {
  const { currentUser, products, recentOrders, wompiConfigured } =
    Route.useLoaderData()
  const router = useRouter()
  const createCheckoutFn = useServerFn(createWompiCheckout)
  const [state, dispatch] = useReducer(
    storefrontReducer,
    currentUser,
    createInitialState
  )
  const [isPending, startTransition] = useTransition()

  const cartItems = products.flatMap((product) => {
    const quantity = state.quantities[product.id] ?? 0
    return quantity > 0
      ? [{ product, quantity, lineTotal: product.priceInCents * quantity }]
      : []
  })
  const cartTotal = cartItems.reduce((total, item) => total + item.lineTotal, 0)

  function updateQuantity(productId: string, quantity: number) {
    dispatch({ type: "setQuantity", productId, quantity })
  }

  function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    dispatch({ type: "startCheckout" })

    startTransition(async () => {
      try {
        const result = await createCheckoutFn({
          data: {
            customerName: state.customerName,
            customerEmail: state.customerEmail,
            items: cartItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
            })),
          },
        })
        dispatch({ type: "checkoutSuccess", result })
        await router.invalidate()
      } catch (error) {
        dispatch({
          type: "checkoutError",
          message:
            error instanceof Error
              ? error.message
              : "Unable to create checkout.",
        })
      }
    })
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">Wompi Commerce</p>
            <p className="text-xs text-muted-foreground">
              TanStack Start + Turso + Drizzle
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button>Sign in to checkout</Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:py-12">
        <section className="space-y-8">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              Hosted checkout demo using @pulgueta/wompi
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
                A small shop that shows the Wompi integration path.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-pretty text-muted-foreground">
                Pick mock products, sign in, and create an order. The server
                function upserts the Clerk user, writes the order to SQLite, and
                calls Wompi to create a single-use payment link.
              </p>
            </div>
          </div>

          <ProductGrid
            products={products}
            quantities={state.quantities}
            onQuantityChange={updateQuantity}
          />
        </section>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <CheckoutPanel
            cartItems={cartItems}
            cartTotal={cartTotal}
            checkoutError={state.checkoutError}
            checkoutResult={state.checkoutResult}
            customerEmail={state.customerEmail}
            customerName={state.customerName}
            isPending={isPending}
            wompiConfigured={wompiConfigured}
            onCheckout={handleCheckout}
            onCustomerEmailChange={(value) =>
              dispatch({ type: "setCustomerEmail", value })
            }
            onCustomerNameChange={(value) =>
              dispatch({ type: "setCustomerName", value })
            }
          />
          <RecentOrders orders={recentOrders} />
        </aside>
      </main>
    </div>
  )
}

function createInitialState(currentUser: StoreUser | null): StorefrontState {
  return {
    quantities: {},
    customerName: currentUser?.name ?? "",
    customerEmail: currentUser?.email ?? "",
    checkoutResult: null,
    checkoutError: null,
  }
}

function storefrontReducer(
  state: StorefrontState,
  action: StorefrontAction
): StorefrontState {
  switch (action.type) {
    case "setQuantity": {
      const quantities = { ...state.quantities }
      if (action.quantity <= 0) {
        delete quantities[action.productId]
      } else {
        quantities[action.productId] = action.quantity
      }
      return { ...state, quantities }
    }
    case "setCustomerName":
      return { ...state, customerName: action.value }
    case "setCustomerEmail":
      return { ...state, customerEmail: action.value }
    case "startCheckout":
      return { ...state, checkoutError: null, checkoutResult: null }
    case "checkoutSuccess":
      return { ...state, checkoutResult: action.result }
    case "checkoutError":
      return { ...state, checkoutError: action.message }
  }
}
