import type { Env as _Env, Context as _Context } from "hono";
import type { User, Session } from "lucia";
import type { ENV } from "../env.js";
import type { DB } from "../db.js";
import type { Lucia } from "../lucia.js";

type Bindings = ENV & {};
type Variables = {
  db: DB;
  lucia: Lucia;
};

declare module "hono" {
  interface ContextVariableMap extends Variables {}
}

export interface PublicEnv extends _Env {
  Bindings: Bindings;
  Variables: Variables;
}

export interface ProtectedEnv extends PublicEnv {
  Variables: Variables & {
    user: User;
    session: Session;
  };
}

export type PublicContext = _Context<PublicEnv>;
export type ProtectedContext = _Context<ProtectedEnv>;
