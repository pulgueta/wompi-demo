# Wompi Commerce Demo

This is a small TanStack Start ecommerce application that demonstrates
`@pulgueta/wompi` with Clerk auth, Turso/libSQL SQLite, and Drizzle ORM.

The app seeds a few mock products, lets a signed-in user prepare a Wompi Web
Checkout URL, and redirects the customer to pay. Orders are created from signed
Wompi webhook events, so abandoned checkout redirects do not appear in order
history.

## Environment

Local development works without Turso by falling back to `file:wompi-demo.db`.
For Turso, set:

```bash
TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."
```

To redirect customers to Wompi Web Checkout, set:

```bash
WOMPI_PUBLIC_KEY="pub_test_..."
WOMPI_INTEGRITY_KEY="test_integrity_..."
WOMPI_EVENTS_KEY="test_events_..."
```

`WOMPI_INTEGRITY_KEY` signs the checkout URL. `WOMPI_EVENTS_KEY` verifies the
`/api/wompi-webhook` endpoint before creating or updating an order.

## Database

The production-like Drizzle schema lives in `src/db/schema.ts`; SQL migrations
live in `drizzle/`; and `drizzle.config.ts` is configured for Turso/libSQL.

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
