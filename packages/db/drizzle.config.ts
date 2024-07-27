import type { Config } from "drizzle-kit";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  throw new Error("Environment variable `DATABASE_URL` is required");
}
if (!authToken) {
  throw new Error("Environment variable `DATABASE_AUTH_TOKEN` is required");
}

export default {
  schema: "./src/schema.ts",
  dialect: "sqlite",
  out: "./migrations",
  migrations: {
    table: "migrations",
    schema: "public",
  },
  driver: "turso",
  dbCredentials: {
    url,
    authToken,
  },
  breakpoints: true,
} satisfies Config;
