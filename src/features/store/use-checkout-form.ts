import { useReducer, useTransition } from "react"
import type { FormEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { useCart } from "./cart-context"
import {
  checkoutFormReducer,
  createCheckoutInitialState,
} from "./checkout-form-state"
import type { CheckoutFormState } from "./checkout-form-state"
import { checkoutQueryKey } from "./checkout-query"
import { createWompiCheckout } from "./ecommerce.functions"
import type { StoreUser } from "./ecommerce.server"
import { storefrontQueryKey } from "./storefront-query"
import type { CartItem } from "./storefront-types"

export function useCheckoutForm({
  cartItems,
  currentUser,
}: {
  cartItems: CartItem[]
  currentUser: StoreUser | null
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const createCheckoutFn = useServerFn(createWompiCheckout)
  const {
    actions: { clearCart },
  } = useCart()
  const [state, dispatch] = useReducer(
    checkoutFormReducer,
    currentUser,
    createCheckoutInitialState
  )
  const [isPending, startTransition] = useTransition()

  function setField(
    field: keyof Omit<CheckoutFormState, "checkoutError">,
    value: string
  ) {
    dispatch({ type: "setField", field, value })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    dispatch({ type: "startCheckout" })

    startTransition(async () => {
      try {
        const result = await createCheckoutFn({
          data: {
            customerName: state.customerName.trim(),
            customerEmail: state.customerEmail.trim(),
            customerPhone: state.customerPhone.trim(),
            legalIdType: state.legalIdType,
            legalId: state.legalId.trim(),
            shippingAddressLine1: state.shippingAddressLine1.trim(),
            shippingAddressLine2:
              state.shippingAddressLine2.trim() || undefined,
            shippingCity: state.shippingCity.trim(),
            shippingRegion: state.shippingRegion.trim(),
            shippingPostalCode: state.shippingPostalCode.trim() || undefined,
            items: cartItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
            })),
          },
        })

        if (!result.checkoutUrl) {
          dispatch({ type: "checkoutError", message: result.message })
          return
        }

        clearCart()
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: checkoutQueryKey }),
          queryClient.invalidateQueries({ queryKey: storefrontQueryKey }),
          router.invalidate(),
        ])
        window.location.assign(result.checkoutUrl)
      } catch (error) {
        dispatch({
          type: "checkoutError",
          message:
            error instanceof Error
              ? error.message
              : "No pudimos preparar el pago. Inténtalo de nuevo.",
        })
      }
    })
  }

  return {
    isPending,
    setField,
    state,
    submit,
  }
}
