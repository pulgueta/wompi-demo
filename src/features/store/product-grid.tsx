import { Button } from "@/components/ui/button"
import type { Product } from "@/db/schema"
import { formatCurrency } from "./storefront-types"

export function ProductGrid({
  products,
  quantities,
  onQuantityChange,
}: {
  products: Product[]
  quantities: Record<string, number>
  onQuantityChange: (productId: string, quantity: number) => void
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const quantity = quantities[product.id] ?? 0

        return (
          <article
            key={product.id}
            className="overflow-hidden rounded-xl border bg-card"
          >
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {product.inventory} in stock
                </p>
                {quantity === 0 ? (
                  <Button
                    type="button"
                    onClick={() => onQuantityChange(product.id, 1)}
                  >
                    Add to cart
                  </Button>
                ) : (
                  <div className="flex items-center rounded-md border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onQuantityChange(product.id, quantity - 1)}
                      aria-label={`Remove one ${product.name}`}
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
                      onClick={() => onQuantityChange(product.id, quantity + 1)}
                      disabled={quantity >= product.inventory}
                      aria-label={`Add one ${product.name}`}
                    >
                      +
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
