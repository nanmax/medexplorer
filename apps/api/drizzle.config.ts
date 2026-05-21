import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infrastructure/persistence/drizzle/schema.ts",
  out: "./src/infrastructure/persistence/drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://infokes:infokes@localhost:5432/infokes",
  },
  strict: true,
  verbose: true,
});
