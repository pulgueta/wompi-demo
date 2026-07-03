import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { orderHistoryQueryOptions } from "@/features/store/order-history-query"
import { RecentOrders } from "@/features/store/recent-orders"

export const Route = createFileRoute("/orders")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(orderHistoryQueryOptions),
  component: OrdersPage,
})

function OrdersPage() {
  const { data } = useSuspenseQuery(orderHistoryQueryOptions)

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <Link to="/" className="text-sm font-semibold text-primary">
              Casa Mercado
            </Link>
            <p className="text-xs text-muted-foreground">
              Historial de pagos recibido por webhook
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" render={<Link to="/" />} nativeButton={false}>
              Tienda
            </Button>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button>Iniciar sesión</Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-8 lg:py-12">
        <section className="space-y-3">
          <div className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            Wompi events
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
            Tus pedidos se actualizan desde Wompi.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Un intento de checkout no aparece aquí por abrir o cerrar la
            ventana. La orden se crea cuando Wompi envía un webhook firmado con
            el estado de la transacción.
          </p>
        </section>

        <Show when="signed-out">
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            Inicia sesión para ver los pedidos asociados a tu cuenta.
            <SignInButton mode="modal">
              <Button className="mt-4 w-full sm:w-auto">Iniciar sesión</Button>
            </SignInButton>
          </div>
        </Show>

        <Show when="signed-in">
          <RecentOrders orders={data.orders} />
        </Show>
      </main>
    </div>
  )
}
