import { queryOptions } from "@tanstack/react-query"

import { getStorefront } from "./ecommerce.functions"

export const storefrontQueryKey = ["storefront"] as const

export const storefrontQueryOptions = queryOptions({
  queryKey: storefrontQueryKey,
  queryFn: () => getStorefront(),
})
