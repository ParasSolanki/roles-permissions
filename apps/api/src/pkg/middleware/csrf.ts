import { createMiddleware } from "hono/factory";
import { verifyRequestOrigin } from "oslo/request";
import { forbiddenError } from "../errors/http";

export function csrf() {
  return createMiddleware(async (c, next) => {
    const origin = c.env.ALLOWED_ORIGIN;

    if (c.req.method === "GET") {
      return next();
    }

    const originHeader = c.req.header("Origin") ?? null;
    const hostHeader = c.req.header("Host") ?? null;

    if (
      !originHeader ||
      !hostHeader ||
      !verifyRequestOrigin(originHeader, [hostHeader, origin])
    ) {
      return forbiddenError(c);
    }

    await next();
  });
}
