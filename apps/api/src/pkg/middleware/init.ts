import { createMiddleware } from "hono/factory";
import { createClient, createConnection } from "../db";
import { createLucia } from "../lucia";

export function init() {
  return createMiddleware(async (c, next) => {
    const client = createClient({
      databaseUrl: c.env.DATABASE_URL,
      databaseAuthToken: c.env.DATABASE_AUTH_TOKEN,
    });

    const db = createConnection(client);

    const lucia = createLucia({ client, environment: c.env.ENVIRONMENT });

    c.set("db", db);
    c.set("lucia", lucia);

    await next();
  });
}
