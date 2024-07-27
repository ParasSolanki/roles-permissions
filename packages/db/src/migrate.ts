import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";
import { env } from "./env.js";

async function main() {
  const client = createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });

  const db = drizzle(client);

  console.log("Running migrations");

  await migrate(db, {
    migrationsFolder: "./migrations",
    migrationsTable: "__migrations",
  });

  client.close();

  console.log("Migrated successfully");

  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed");
  console.error(e);
  process.exit(1);
});
