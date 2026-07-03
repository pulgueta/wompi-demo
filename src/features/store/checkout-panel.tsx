import { Show, SignInButton } from "@clerk/tanstack-react-start"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CheckoutResult } from "./ecommerce.server"
import { formatCurrency, type CartItem } from "./storefront-types"

export function CheckoutPanel({
  cartItems,
  cartTotal,
  checkoutError,
  checkoutResult,
  customerEmail,
  customerName,
  isPending,
  wompiConfigured,
  onCheckout,
  onCustomerEmailChange,
  onCustomerNameChange,
}: {
  cartItems: CartItem[]
  cartTotal: number
  checkoutError: string | null
  checkoutResult: CheckoutResult | null
  customerEmail: string
  customerName: string
  isPending: boolean
  wompiConfigured: boolean
  onCheckout: (event: React.FormEvent<HTMLFormElement>) => void
  onCustomerEmailChange: (value: string) => void
  onCustomerNameChange: (value: string) => void
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Checkout</h2>
        <p className="text-sm text-muted-foreground">
          Orders are stored before Wompi is called.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {cartItems.length === 0 ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            Your cart is empty. Add a product to create a Wompi payment link.
          </p>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.product.id}
              className="flex items-start justify-between gap-4 text-sm"
            >
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-muted-foreground">
                  {item.quantity} x {formatCurrency(item.product.priceInCents)}
                </p>
              </div>
              <p className="font-semibold">{formatCurrency(item.lineTotal)}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t pt-4">
        <span className="font-medium">Total</span>
        <span className="text-lg font-semibold">
          {formatCurrency(cartTotal)}
        </span>
      </div>

      {wompiConfigured ? null : (
        <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm text-primary">
          Add WOMPI_PUBLIC_KEY and WOMPI_PRIVATE_KEY to create live hosted
          payment links. Orders will still be persisted for inspection.
        </div>
      )}

      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button className="mt-5 w-full">Sign in before checkout</Button>
        </SignInButton>
      </Show>

      <Show when="signed-in">
        <form className="mt-5 space-y-4" onSubmit={onCheckout}>
          <label className="grid gap-1.5 text-sm font-medium">
            Customer name
            <input
              value={customerName}
              onChange={(event) => onCustomerNameChange(event.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              required
              minLength={2}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Customer email
            <input
              value={customerEmail}
              onChange={(event) => onCustomerEmailChange(event.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              required
              type="email"
            />
          </label>
          <Button
            type="submit"
            className="w-full"
            disabled={cartItems.length === 0 || isPending}
          >
            {isPending ? "Creating checkout..." : "Create Wompi link"}
          </Button>
        </form>
      </Show>

      {checkoutError ? (
        <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {checkoutError}
        </p>
      ) : null}

      {checkoutResult ? (
        <div className="mt-4 space-y-3 rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium">{checkoutResult.message}</p>
          <p className="text-muted-foreground">
            Order {checkoutResult.orderId.slice(0, 8)} is{" "}
            {statusLabel(checkoutResult.status)}.
          </p>
          {checkoutResult.checkoutUrl ? (
            <a
              href={checkoutResult.checkoutUrl}
              className={cn(buttonVariants(), "w-full")}
              target="_blank"
              rel="noreferrer"
            >
              Open Wompi checkout
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function statusLabel(status: CheckoutResult["status"]) {
  switch (status) {
    case "configuration_error":
      return "needs Wompi keys"
    case "payment_link_created":
      return "ready for payment"
    case "pending":
      return "pending"
  }
}
