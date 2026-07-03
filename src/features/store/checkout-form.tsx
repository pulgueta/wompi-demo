import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { legalIdTypeOptions } from "./checkout-form-state"
import type { CheckoutFormState } from "./checkout-form-state"

export function CheckoutForm({
  checkoutError,
  isPending,
  state,
  onFieldChange,
  onSubmit,
}: {
  checkoutError: string | null
  isPending: boolean
  state: CheckoutFormState
  onFieldChange: (
    field: keyof Omit<CheckoutFormState, "checkoutError">,
    value: string
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Nombre completo
          <input
            value={state.customerName}
            onChange={(event) =>
              onFieldChange("customerName", event.target.value)
            }
            className="h-10 rounded-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            required
            minLength={2}
            autoComplete="name"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Correo electrónico
          <input
            value={state.customerEmail}
            onChange={(event) =>
              onFieldChange("customerEmail", event.target.value)
            }
            className="h-10 rounded-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            required
            type="email"
            autoComplete="email"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Celular
          <div className="flex">
            <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
              +57
            </span>
            <input
              value={state.customerPhone}
              onChange={(event) =>
                onFieldChange("customerPhone", event.target.value)
              }
              className="h-10 min-w-0 flex-1 rounded-r-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              required
              inputMode="numeric"
              pattern="[0-9]{7,10}"
              autoComplete="tel-national"
            />
          </div>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Tipo de documento
          <select
            value={state.legalIdType}
            onChange={(event) =>
              onFieldChange("legalIdType", event.target.value)
            }
            className="h-10 rounded-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            required
          >
            {legalIdTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Número de documento
          <input
            value={state.legalId}
            onChange={(event) => onFieldChange("legalId", event.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            required
            minLength={5}
            maxLength={20}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
        <div>
          <h2 className="font-semibold">Entrega</h2>
          <p className="text-sm text-muted-foreground">
            Guardamos estos datos en el pedido y Wompi solicitará la dirección
            de envío durante el pago.
          </p>
        </div>
        <label className="grid gap-1.5 text-sm font-medium">
          Dirección
          <input
            value={state.shippingAddressLine1}
            onChange={(event) =>
              onFieldChange("shippingAddressLine1", event.target.value)
            }
            className="h-10 rounded-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            required
            minLength={5}
            autoComplete="address-line1"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Apartamento, torre o referencia
          <input
            value={state.shippingAddressLine2}
            onChange={(event) =>
              onFieldChange("shippingAddressLine2", event.target.value)
            }
            className="h-10 rounded-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            autoComplete="address-line2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium">
            Ciudad
            <input
              value={state.shippingCity}
              onChange={(event) =>
                onFieldChange("shippingCity", event.target.value)
              }
              className="h-10 rounded-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              required
              autoComplete="address-level2"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Departamento
            <input
              value={state.shippingRegion}
              onChange={(event) =>
                onFieldChange("shippingRegion", event.target.value)
              }
              className="h-10 rounded-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              required
              autoComplete="address-level1"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Código postal
            <input
              value={state.shippingPostalCode}
              onChange={(event) =>
                onFieldChange("shippingPostalCode", event.target.value)
              }
              className="h-10 rounded-md border bg-background px-3 text-sm transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              autoComplete="postal-code"
            />
          </label>
        </div>
      </div>

      {checkoutError ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {checkoutError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Preparando pago..." : "Pagar ahora con Wompi"}
      </Button>
    </form>
  )
}
