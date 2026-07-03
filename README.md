# Wompi Commerce Demo

This is a small TanStack Start ecommerce application that demonstrates
`@pulgueta/wompi` with Clerk auth, Turso/libSQL SQLite, and Drizzle ORM.

The app seeds a few mock products, lets a signed-in user create an order, stores
the order and line items in SQLite, then uses Wompi to create a hosted payment
link.

## Environment

Local development works without Turso by falling back to `file:wompi-demo.db`.
For Turso, set:

```bash
TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."
```

To create live Wompi payment links, set:

```bash
WOMPI_PUBLIC_KEY="pub_test_..."
WOMPI_PRIVATE_KEY="prv_test_..."
WOMPI_INTEGRITY_KEY="test_integrity_..." # optional for payment links
WOMPI_SANDBOX="true"
```

The checkout server function handles missing Wompi keys by still persisting the
order with a configuration status, which keeps the demo inspectable.

## Database

The production-like Drizzle schema lives in `src/db/schema.ts`; the initial SQL
migration lives in `drizzle/0000_initial_ecommerce.sql`; and `drizzle.config.ts`
is configured for Turso/libSQL.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button"
```
