import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { formatCurrency } from "./storefront-types"
import type { CartItem } from "./storefront-types"

export function OrderSummary({
  cartItems,
  cartTotal,
}: {
  cartItems: CartItem[]
  cartTotal: number
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Resumen del pedido</h2>
        <p className="text-sm text-muted-foreground">
          Verifica tus productos antes de pagar.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {cartItems.length === 0 ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            Tu carrito está vacío.
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

      {cartItems.length === 0 ? (
        <Button className="mt-5 w-full" render={<Link to="/" />}>
          Volver a la tienda
        </Button>
      ) : null}
    </section>
  )
}
