import { relations } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("users_clerk_user_id_idx").on(table.clerkUserId)]
)

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    imagePath: text("image_path").notNull(),
    priceInCents: integer("price_in_cents").notNull(),
    inventory: integer("inventory").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("products_active_idx").on(table.active),
    index("products_slug_idx").on(table.slug),
  ]
)

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["pending", "approved", "declined", "error", "voided"],
    })
      .notNull()
      .default("pending"),
    amountInCents: integer("amount_in_cents").notNull(),
    currency: text("currency", { enum: ["COP"] })
      .notNull()
      .default("COP"),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    legalIdType: text("legal_id_type", {
      enum: ["CC", "CE", "NIT", "PP", "TI"],
    }),
    legalId: text("legal_id"),
    shippingAddressLine1: text("shipping_address_line_1"),
    shippingAddressLine2: text("shipping_address_line_2"),
    shippingCity: text("shipping_city"),
    shippingRegion: text("shipping_region"),
    shippingPostalCode: text("shipping_postal_code"),
    wompiReference: text("wompi_reference").notNull().unique(),
    wompiTransactionId: text("wompi_transaction_id"),
    wompiPaymentMethodType: text("wompi_payment_method_type"),
    wompiCheckoutUrl: text("wompi_checkout_url"),
    wompiError: text("wompi_error"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_wompi_reference_idx").on(table.wompiReference),
  ]
)

export const checkoutSessions = sqliteTable(
  "checkout_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountInCents: integer("amount_in_cents").notNull(),
    currency: text("currency", { enum: ["COP"] })
      .notNull()
      .default("COP"),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    legalIdType: text("legal_id_type", {
      enum: ["CC", "CE", "NIT", "PP", "TI"],
    }),
    legalId: text("legal_id"),
    shippingAddressLine1: text("shipping_address_line_1"),
    shippingAddressLine2: text("shipping_address_line_2"),
    shippingCity: text("shipping_city"),
    shippingRegion: text("shipping_region"),
    shippingPostalCode: text("shipping_postal_code"),
    wompiReference: text("wompi_reference").notNull().unique(),
    wompiCheckoutUrl: text("wompi_checkout_url").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("checkout_sessions_user_id_idx").on(table.userId),
    index("checkout_sessions_wompi_reference_idx").on(table.wompiReference),
  ]
)

export const checkoutSessionItems = sqliteTable(
  "checkout_session_items",
  {
    id: text("id").primaryKey(),
    checkoutSessionId: text("checkout_session_id")
      .notNull()
      .references(() => checkoutSessions.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    productName: text("product_name").notNull(),
    unitPriceInCents: integer("unit_price_in_cents").notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("checkout_session_items_session_id_idx").on(table.checkoutSessionId),
    index("checkout_session_items_product_id_idx").on(table.productId),
  ]
)

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    productName: text("product_name").notNull(),
    unitPriceInCents: integer("unit_price_in_cents").notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_product_id_idx").on(table.productId),
  ]
)

export const usersRelations = relations(users, ({ many }) => ({
  checkoutSessions: many(checkoutSessions),
  orders: many(orders),
}))

export const productsRelations = relations(products, ({ many }) => ({
  checkoutSessionItems: many(checkoutSessionItems),
  orderItems: many(orderItems),
}))

export const checkoutSessionsRelations = relations(
  checkoutSessions,
  ({ many, one }) => ({
    user: one(users, {
      fields: [checkoutSessions.userId],
      references: [users.id],
    }),
    items: many(checkoutSessionItems),
  })
)

export const checkoutSessionItemsRelations = relations(
  checkoutSessionItems,
  ({ one }) => ({
    checkoutSession: one(checkoutSessions, {
      fields: [checkoutSessionItems.checkoutSessionId],
      references: [checkoutSessions.id],
    }),
    product: one(products, {
      fields: [checkoutSessionItems.productId],
      references: [products.id],
    }),
  })
)

export const ordersRelations = relations(orders, ({ many, one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))

export type Product = typeof products.$inferSelect
export type CheckoutSession = typeof checkoutSessions.$inferSelect
export type CheckoutSessionItem = typeof checkoutSessionItems.$inferSelect
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
export type User = typeof users.$inferSelect
