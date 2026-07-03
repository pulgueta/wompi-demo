import { createServerFn } from "@tanstack/react-start"
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server"
import { z } from "zod"

import {
  createCheckout,
  getCheckoutData,
  getOrderHistoryData,
  getStorefrontData,
} from "./ecommerce.server"

const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
})

const createCheckoutSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.email(),
  customerPhone: z.string().regex(/^\d{7,10}$/),
  legalIdType: z.enum(["CC", "CE", "NIT", "PP", "TI"]),
  legalId: z.string().min(5).max(20),
  shippingAddressLine1: z.string().min(5).max(140),
  shippingAddressLine2: z.string().max(140).optional(),
  shippingCity: z.string().min(2).max(80),
  shippingRegion: z.string().min(2).max(80),
  shippingPostalCode: z.string().max(20).optional(),
  items: z.array(checkoutItemSchema).min(1).max(10),
})

export const getStorefront = createServerFn({ method: "GET" }).handler(
  async () => {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "public, max-age=60",
      })
    )

    return await getStorefrontData()
  }
)

export const getCheckout = createServerFn({ method: "GET" }).handler(
  async () => {
    setPrivateResponseHeaders()

    return await getCheckoutData()
  }
)

export const getOrderHistory = createServerFn({ method: "GET" }).handler(
  async () => {
    setPrivateResponseHeaders()

    return await getOrderHistoryData()
  }
)

export const createWompiCheckout = createServerFn({ method: "POST" })
  .validator(createCheckoutSchema)
  .handler(async ({ data }) => {
    setPrivateResponseHeaders()

    const request = getRequest()
    const appOrigin =
      process.env.PUBLIC_APP_URL ??
      process.env.APP_URL ??
      new URL(request.url).origin
    const redirectUrl = new URL("/orders", appOrigin)
    redirectUrl.searchParams.set("checkout", "complete")

    return await createCheckout({
      ...data,
      redirectUrl: redirectUrl.toString(),
    })
  })

function setPrivateResponseHeaders() {
  setResponseHeaders(
    new Headers({
      "Cache-Control": "no-store",
      Vary: "Cookie, Authorization",
    })
  )
}
