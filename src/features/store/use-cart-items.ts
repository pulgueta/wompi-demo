import type { Product } from "@/db/schema"
import { useCart } from "./cart-context"
import type { CartItem } from "./storefront-types"

export function useCartItems(products: Product[]) {
  const { state } = useCart()

  const cartItems = products.flatMap((product): CartItem[] => {
    const quantity = state.quantities[product.id] ?? 0
    return quantity > 0
      ? [{ product, quantity, lineTotal: product.priceInCents * quantity }]
      : []
  })

  const cartTotal = cartItems.reduce((total, item) => total + item.lineTotal, 0)
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  return { cartCount, cartItems, cartTotal }
}
