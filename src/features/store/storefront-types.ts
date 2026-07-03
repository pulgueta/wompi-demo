import type { Product } from "@/db/schema"

export type CartItem = {
  product: Product
  quantity: number
  lineTotal: number
}

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
})

export function formatCurrency(amountInCents: number) {
  return currencyFormatter.format(amountInCents / 100)
}
