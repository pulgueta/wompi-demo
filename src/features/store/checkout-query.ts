import { queryOptions } from "@tanstack/react-query"

import { getCheckout } from "./ecommerce.functions"

export const checkoutQueryKey = ["checkout"] as const

export const checkoutQueryOptions = queryOptions({
  queryKey: checkoutQueryKey,
  queryFn: () => getCheckout(),
})
