import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import type { Product } from "@/db/schema"
import { formatCurrency } from "./storefront-types"
import { useCartItems } from "./use-cart-items"

export function CartSummary({ products }: { products: Product[] }) {
  const { cartCount, cartItems, cartTotal } = useCartItems(products)

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Tu carrito</h2>
        <p className="text-sm text-muted-foreground">
          {cartCount > 0
            ? `${cartCount} producto${cartCount === 1 ? "" : "s"} listo${
                cartCount === 1 ? "" : "s"
              } para pagar`
            : "Agrega tus favoritos y paga en Wompi."}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {cartItems.length === 0 ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            Elige un producto para preparar tu compra.
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
        <Button className="mt-5 w-full" disabled>
          Finalizar compra
        </Button>
      ) : (
        <Button className="mt-5 w-full" render={<Link to="/checkout" />}>
          Finalizar compra
        </Button>
      )}
    </section>
  )
}
