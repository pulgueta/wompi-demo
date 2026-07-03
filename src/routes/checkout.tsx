import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { CheckoutForm } from "@/features/store/checkout-form"
import { checkoutQueryOptions } from "@/features/store/checkout-query"
import { OrderSummary } from "@/features/store/order-summary"
import { useCartItems } from "@/features/store/use-cart-items"
import { useCheckoutForm } from "@/features/store/use-checkout-form"

export const Route = createFileRoute("/checkout")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(checkoutQueryOptions),
  component: Checkout,
})

function Checkout() {
  const { data } = useSuspenseQuery(checkoutQueryOptions)
  const { cartItems, cartTotal } = useCartItems(data.products)
  const checkoutForm = useCheckoutForm({
    cartItems,
    currentUser: data.currentUser,
  })

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <Link to="/" className="text-sm font-semibold text-primary">
              Casa Mercado
            </Link>
            <p className="text-xs text-muted-foreground">
              Checkout seguro para Colombia
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" render={<Link to="/" />}>
              Seguir comprando
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

      <main className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:py-12">
        <section className="space-y-6 rounded-xl border bg-card p-5 sm:p-6">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              Pago con Wompi
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
                Completa tus datos para pagar ahora.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Usamos estos campos para preparar el checkout de Wompi con tu
                nombre, correo, celular y documento. La orden queda guardada
                cuando Wompi confirma la transacción por webhook.
              </p>
            </div>
          </div>

          {data.wompiConfigured ? null : (
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm text-primary">
              Configura WOMPI_PUBLIC_KEY y WOMPI_INTEGRITY_KEY para redirigir a
              Wompi. También configura WOMPI_EVENTS_KEY para verificar webhooks
              y actualizar el historial de pedidos.
            </div>
          )}

          <Show when="signed-out">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              Inicia sesión para asociar el pedido a tu cuenta y continuar con
              el pago.
              <SignInButton mode="modal">
                <Button className="mt-4 w-full sm:w-auto">
                  Iniciar sesión
                </Button>
              </SignInButton>
            </div>
          </Show>

          <Show when="signed-in">
            {cartItems.length === 0 ? (
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                Tu carrito está vacío. Vuelve a la tienda y elige un producto
                para continuar.
              </div>
            ) : (
              <CheckoutForm
                checkoutError={checkoutForm.state.checkoutError}
                isPending={checkoutForm.isPending}
                state={checkoutForm.state}
                onFieldChange={checkoutForm.setField}
                onSubmit={checkoutForm.submit}
              />
            )}
          </Show>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <OrderSummary cartItems={cartItems} cartTotal={cartTotal} />
        </aside>
      </main>
    </div>
  )
}
