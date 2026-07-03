import { useNavigate } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import type { Product } from "@/db/schema"
import { useCart } from "./cart-context"
import { formatCurrency } from "./storefront-types"

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate()
  const {
    state: { quantities },
    actions,
  } = useCart()
  const quantity = quantities[product.id] ?? 0

  async function buyNow() {
    if (quantity === 0) {
      actions.addItem(product.id)
    }
    await navigate({ to: "/checkout" })
  }

  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <img
        src={product.imagePath}
        alt=""
        className="h-52 w-full bg-muted object-cover"
      />
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="shrink-0 font-semibold text-primary">
              {formatCurrency(product.priceInCents)}
            </p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {product.description}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {product.inventory} disponibles
            </p>
            {quantity === 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => actions.addItem(product.id)}
              >
                Agregar
              </Button>
            ) : (
              <div className="flex items-center rounded-md border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => actions.setQuantity(product.id, quantity - 1)}
                  aria-label={`Quitar una unidad de ${product.name}`}
                >
                  -
                </Button>
                <span className="min-w-8 text-center text-sm font-medium">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => actions.setQuantity(product.id, quantity + 1)}
                  disabled={quantity >= product.inventory}
                  aria-label={`Agregar una unidad de ${product.name}`}
                >
                  +
                </Button>
              </div>
            )}
          </div>
          <Button type="button" className="w-full" onClick={buyNow}>
            Comprar ahora
          </Button>
        </div>
      </div>
    </article>
  )
}
