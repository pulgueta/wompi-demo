import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { CartSummary } from "@/features/store/cart-summary"
import { ProductGrid } from "@/features/store/product-grid"
import { storefrontQueryOptions } from "@/features/store/storefront-query"

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(storefrontQueryOptions),
  component: Storefront,
})

function Storefront() {
  const { data } = useSuspenseQuery(storefrontQueryOptions)
  const { products } = data

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">Casa Mercado</p>
            <p className="text-xs text-muted-foreground">
              Objetos seleccionados para casa y café
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" render={<Link to="/orders" />}>
              Pedidos
            </Button>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button>Sign in to checkout</Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:py-12">
        <section className="space-y-8">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              Pagos seguros con Wompi
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
                Compra piezas cuidadas para estrenar esta semana.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-pretty text-muted-foreground">
                Elige tus productos, completa tus datos de entrega en Colombia y
                paga en una experiencia segura de Wompi. El pedido aparece en tu
                historial cuando Wompi confirma el pago por webhook.
              </p>
            </div>
          </div>

          <ProductGrid products={products} />
        </section>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <CartSummary products={products} />
        </aside>
      </main>
    </div>
  )
}
