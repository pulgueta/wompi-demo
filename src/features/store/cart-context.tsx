import { createContext, use, useReducer } from "react"

type CartState = {
  quantities: Record<string, number>
}

type CartActions = {
  addItem: (productId: string) => void
  clearCart: () => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
}

type CartContextValue = {
  state: CartState
  actions: CartActions
}

type CartAction =
  | { type: "addItem"; productId: string }
  | { type: "clearCart" }
  | { type: "removeItem"; productId: string }
  | { type: "setQuantity"; productId: string; quantity: number }

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { quantities: {} })

  const actions: CartActions = {
    addItem: (productId) => dispatch({ type: "addItem", productId }),
    clearCart: () => dispatch({ type: "clearCart" }),
    removeItem: (productId) => dispatch({ type: "removeItem", productId }),
    setQuantity: (productId, quantity) =>
      dispatch({ type: "setQuantity", productId, quantity }),
  }

  return <CartContext value={{ state, actions }}>{children}</CartContext>
}

export function useCart() {
  const cart = use(CartContext)
  if (!cart) {
    throw new Error("useCart must be used within CartProvider")
  }

  return cart
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "addItem": {
      const currentQuantity = state.quantities[action.productId] ?? 0
      return {
        quantities: {
          ...state.quantities,
          [action.productId]: currentQuantity + 1,
        },
      }
    }
    case "clearCart":
      return { quantities: {} }
    case "removeItem": {
      const quantities = { ...state.quantities }
      delete quantities[action.productId]
      return { quantities }
    }
    case "setQuantity": {
      const quantities = { ...state.quantities }
      if (action.quantity <= 0) {
        delete quantities[action.productId]
      } else {
        quantities[action.productId] = action.quantity
      }
      return { quantities }
    }
  }
}
