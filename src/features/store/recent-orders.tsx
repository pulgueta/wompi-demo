import type { Order } from "@/db/schema"
import type { RecentOrder } from "./ecommerce.server"
import { formatCurrency } from "./storefront-types"

export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Pedidos</h2>
        <p className="text-sm text-muted-foreground">
          Solo aparecen cuando Wompi confirma una transacción por webhook.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay transacciones confirmadas por webhook.
          </p>
        ) : (
          orders.map((order) => (
            <article key={order.id} className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  {formatCurrency(order.amountInCents)}
                </p>
                <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {statusLabel(order.status)}
                </span>
              </div>
              <p className="text-xs break-all text-muted-foreground">
                {order.wompiReference}
              </p>
              <ul className="space-y-1 text-sm">
                {order.items.map((item) => (
                  <li
                    key={`${order.id}-${item.productName}`}
                    className="flex justify-between gap-3"
                  >
                    <span>{item.productName}</span>
                    <span className="text-muted-foreground">
                      x{item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
              {order.wompiTransactionId ? (
                <p className="text-xs break-all text-muted-foreground">
                  Wompi transaction: {order.wompiTransactionId}
                </p>
              ) : null}
              {order.wompiError ? (
                <p className="text-xs text-destructive">{order.wompiError}</p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  )
}

function statusLabel(status: Order["status"]) {
  switch (status) {
    case "approved":
      return "aprobado"
    case "declined":
      return "rechazado"
    case "error":
      return "error"
    case "pending":
      return "pendiente"
    case "voided":
      return "anulado"
  }
}
