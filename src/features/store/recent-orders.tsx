import type { CheckoutResult, RecentOrder } from "./ecommerce.server"
import { formatCurrency } from "./storefront-types"

export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Recent orders</h2>
        <p className="text-sm text-muted-foreground">
          Loaded through the same server function as the catalog.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sign in and create an order to see persisted Wompi metadata.
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
              {order.wompiCheckoutUrl ? (
                <a
                  href={order.wompiCheckoutUrl}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Reopen checkout
                </a>
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

function statusLabel(status: CheckoutResult["status"]) {
  switch (status) {
    case "configuration_error":
      return "needs Wompi keys"
    case "payment_link_created":
      return "ready for payment"
    case "pending":
      return "pending"
  }
}
