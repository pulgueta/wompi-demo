import { createFileRoute } from "@tanstack/react-router"

import { processWompiWebhook } from "@/features/store/ecommerce.server"

export const Route = createFileRoute("/api/wompi-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const result = await processWompiWebhook(await request.text())

          return Response.json(
            {
              message: result.message,
              ok: result.ok,
            },
            { status: result.status }
          )
        } catch (error) {
          console.error("Wompi webhook processing failed:", error)

          return Response.json(
            {
              message: "Webhook processing failed.",
              ok: false,
            },
            { status: 500 }
          )
        }
      },
    },
  },
})
