import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { z } from "zod"

import { createCheckout, getStorefrontData } from "./ecommerce.server"

const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
})

const createCheckoutSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.email(),
  items: z.array(checkoutItemSchema).min(1).max(10),
})

export const getStorefront = createServerFn({ method: "GET" }).handler(
  async () => {
    return await getStorefrontData()
  }
)

export const createWompiCheckout = createServerFn({ method: "POST" })
  .validator(createCheckoutSchema)
  .handler(async ({ data }) => {
    const request = getRequest()
    const redirectUrl = new URL("/", request.url)
    redirectUrl.searchParams.set("checkout", "complete")

    return await createCheckout({
      ...data,
      redirectUrl: redirectUrl.toString(),
    })
  })
