import { createClient } from "@libsql/client"
import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"

import * as schema from "./schema"
import { products } from "./schema"

const databaseUrl =
  process.env.TURSO_DATABASE_URL ??
  process.env.LIBSQL_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "file:wompi-demo.db"

const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.LIBSQL_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })

const mockProducts = [
  {
    id: "prod-cafe-kit",
    slug: "cafetera-andina-kit",
    name: "Cafetera Andina Kit",
    description:
      "A compact pour-over set with filters, glass server, and Colombian roast notes.",
    imagePath: "/products/cafetera-andina.svg",
    priceInCents: 129_000_00,
    inventory: 18,
  },
  {
    id: "prod-carryall",
    slug: "mercado-carryall",
    name: "Mercado Carryall",
    description:
      "Waxed canvas tote with reinforced handles for errands, office days, and weekend markets.",
    imagePath: "/products/mercado-carryall.svg",
    priceInCents: 179_000_00,
    inventory: 24,
  },
  {
    id: "prod-desk-lamp",
    slug: "calima-desk-lamp",
    name: "Calima Desk Lamp",
    description:
      "A warm dimmable lamp with a weighted ceramic base and woven shade.",
    imagePath: "/products/calima-lamp.svg",
    priceInCents: 219_000_00,
    inventory: 9,
  },
] as const

let bootstrapPromise: Promise<void> | undefined

export function ensureDatabaseReady() {
  bootstrapPromise ??= bootstrapDatabase()
  return bootstrapPromise
}

async function bootstrapDatabase() {
  await db.run(sql`PRAGMA foreign_keys = ON`)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      clerk_user_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS users_clerk_user_id_idx
    ON users (clerk_user_id)
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_path TEXT NOT NULL,
      price_in_cents INTEGER NOT NULL,
      inventory INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS products_active_idx
    ON products (active)
  `)
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS products_slug_idx
    ON products (slug)
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      amount_in_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'COP',
      customer_email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      wompi_reference TEXT NOT NULL UNIQUE,
      wompi_payment_link_id TEXT,
      wompi_checkout_url TEXT,
      wompi_error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS orders_user_id_idx
    ON orders (user_id)
  `)
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS orders_wompi_reference_idx
    ON orders (wompi_reference)
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY NOT NULL,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      unit_price_in_cents INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS order_items_order_id_idx
    ON order_items (order_id)
  `)
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS order_items_product_id_idx
    ON order_items (product_id)
  `)

  const now = Date.now()
  await db
    .insert(products)
    .values(
      mockProducts.map((product) => ({
        ...product,
        createdAt: now,
        updatedAt: now,
      }))
    )
    .onConflictDoNothing()
}
