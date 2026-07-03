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
      "Set compacto para preparar café filtrado con jarra de vidrio, filtros y notas de tueste colombiano.",
    imagePath: "/products/cafetera-andina.svg",
    priceInCents: 129_000_00,
    inventory: 18,
  },
  {
    id: "prod-carryall",
    slug: "mercado-carryall",
    name: "Mercado Carryall",
    description:
      "Bolso de lona encerada con cargaderas reforzadas para diligencias, oficina y mercado de fin de semana.",
    imagePath: "/products/mercado-carryall.svg",
    priceInCents: 179_000_00,
    inventory: 24,
  },
  {
    id: "prod-desk-lamp",
    slug: "calima-desk-lamp",
    name: "Calima Desk Lamp",
    description:
      "Lámpara cálida regulable con base cerámica pesada y pantalla tejida para escritorio o mesa de noche.",
    imagePath: "/products/calima-lamp.svg",
    priceInCents: 219_000_00,
    inventory: 9,
  },
] as const

let bootstrapPromise: Promise<void> | undefined

export function ensureDatabaseReady() {
  bootstrapPromise ??= bootstrapDatabase().catch((error) => {
    bootstrapPromise = undefined
    throw error
  })
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
      customer_phone TEXT,
      legal_id_type TEXT,
      legal_id TEXT,
      shipping_address_line_1 TEXT,
      shipping_address_line_2 TEXT,
      shipping_city TEXT,
      shipping_region TEXT,
      shipping_postal_code TEXT,
      wompi_reference TEXT NOT NULL UNIQUE,
      wompi_transaction_id TEXT,
      wompi_payment_method_type TEXT,
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
  await addColumnIfMissing("orders", "wompi_transaction_id", "TEXT")
  await addColumnIfMissing("orders", "wompi_payment_method_type", "TEXT")
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS checkout_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount_in_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'COP',
      customer_email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      legal_id_type TEXT,
      legal_id TEXT,
      shipping_address_line_1 TEXT,
      shipping_address_line_2 TEXT,
      shipping_city TEXT,
      shipping_region TEXT,
      shipping_postal_code TEXT,
      wompi_reference TEXT NOT NULL UNIQUE,
      wompi_checkout_url TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS checkout_sessions_user_id_idx
    ON checkout_sessions (user_id)
  `)
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS checkout_sessions_wompi_reference_idx
    ON checkout_sessions (wompi_reference)
  `)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS checkout_session_items (
      id TEXT PRIMARY KEY NOT NULL,
      checkout_session_id TEXT NOT NULL REFERENCES checkout_sessions(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      unit_price_in_cents INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS checkout_session_items_session_id_idx
    ON checkout_session_items (checkout_session_id)
  `)
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS checkout_session_items_product_id_idx
    ON checkout_session_items (product_id)
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
  for (const product of mockProducts) {
    await db
      .insert(products)
      .values({
        ...product,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          slug: product.slug,
          name: product.name,
          description: product.description,
          imagePath: product.imagePath,
          priceInCents: product.priceInCents,
          inventory: product.inventory,
          active: true,
          updatedAt: now,
        },
      })
  }
}

async function addColumnIfMissing(
  tableName: string,
  columnName: string,
  definition: string
) {
  const tableInfo = await client.execute(`PRAGMA table_info(${tableName})`)
  const hasColumn = tableInfo.rows.some((row) => row.name === columnName)

  if (!hasColumn) {
    await client.execute(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
    )
  }
}
