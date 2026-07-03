import type { StoreUser } from "./ecommerce.server"

export const legalIdTypeOptions = [
  { label: "Cédula de ciudadanía", value: "CC" },
  { label: "Cédula de extranjería", value: "CE" },
  { label: "NIT", value: "NIT" },
  { label: "Pasaporte", value: "PP" },
  { label: "Tarjeta de identidad", value: "TI" },
] as const

export type LegalIdType = (typeof legalIdTypeOptions)[number]["value"]

export type CheckoutFormState = {
  customerName: string
  customerEmail: string
  customerPhone: string
  legalIdType: LegalIdType
  legalId: string
  shippingAddressLine1: string
  shippingAddressLine2: string
  shippingCity: string
  shippingRegion: string
  shippingPostalCode: string
  checkoutError: string | null
}

export type CheckoutFormAction =
  | {
      type: "setField"
      field: keyof Omit<CheckoutFormState, "checkoutError">
      value: string
    }
  | { type: "startCheckout" }
  | { type: "checkoutError"; message: string }

export function createCheckoutInitialState(
  currentUser: StoreUser | null
): CheckoutFormState {
  return {
    customerName: currentUser?.name ?? "",
    customerEmail: currentUser?.email ?? "",
    customerPhone: "",
    legalIdType: "CC",
    legalId: "",
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingCity: "",
    shippingRegion: "",
    shippingPostalCode: "",
    checkoutError: null,
  }
}

export function checkoutFormReducer(
  state: CheckoutFormState,
  action: CheckoutFormAction
): CheckoutFormState {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value }
    case "startCheckout":
      return { ...state, checkoutError: null }
    case "checkoutError":
      return { ...state, checkoutError: action.message }
  }
}
