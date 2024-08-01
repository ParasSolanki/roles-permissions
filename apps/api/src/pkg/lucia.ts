import type { Client } from "./db";
import { LibSQLAdapter } from "@lucia-auth/adapter-sqlite";
import { Lucia as _Lucia, TimeSpan } from "lucia";
import type { Environment } from "./env";

type LuciaOptions = {
  client: Client;
  environment: Environment;
};

export function createLucia(opts: LuciaOptions) {
  const adapter = new LibSQLAdapter(opts.client, {
    user: "users",
    session: "user_sessions",
  });

  const lucia = new _Lucia(adapter, {
    sessionExpiresIn: new TimeSpan(1, "d"),
    sessionCookie: {
      name: "role-permission-session",
      expires: true,
      attributes: {
        sameSite: "strict",
        // set to `true` when using HTTPS
        secure: opts.environment === "production",
      },
    },

    getUserAttributes: (attributes) => {
      return {
        // attributes has the type of DatabaseUserAttributes
        email: attributes.email,
      };
    },
  });

  return lucia;
}

export type Lucia = ReturnType<typeof createLucia>;

declare module "lucia" {
  interface Register {
    Lucia: Lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }

  interface DatabaseUserAttributes {
    email: string;
  }
}
