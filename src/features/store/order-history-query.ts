import { queryOptions } from "@tanstack/react-query"

import { getOrderHistory } from "./ecommerce.functions"

export const orderHistoryQueryKey = ["order-history"] as const

export const orderHistoryQueryOptions = queryOptions({
  queryKey: orderHistoryQueryKey,
  queryFn: () => getOrderHistory(),
})
