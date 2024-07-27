import { drizzle } from "drizzle-orm/libsql";
import { createClient as createLibSqlClient } from "@libsql/client";
import type { Client as LibSqlClient } from "@libsql/client";

export type ClientOptions = {
  databaseUrl: string;
  databaseAuthToken: string;
};

export type Client = LibSqlClient;

export function createClient(opts: ClientOptions) {
  return createLibSqlClient({
    url: opts.databaseUrl,
    authToken: opts.databaseAuthToken,
  });
}

export type DB = ReturnType<typeof createConnection>;

export function createConnection(client: Client) {
  const db = drizzle(client);

  return db;
}

export * from "@roles-permissions/db";
