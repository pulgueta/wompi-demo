import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url:
      process.env.TURSO_DATABASE_URL ??
      process.env.LIBSQL_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "file:wompi-demo.db",
    authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.LIBSQL_AUTH_TOKEN,
  },
})
