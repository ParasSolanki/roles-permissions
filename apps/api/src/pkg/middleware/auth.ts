import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { unauthorizedError } from "../errors/http";

export function auth() {
  return createMiddleware(async (c, next) => {
    const lucia = c.get("lucia");
    const sessionCookie = getCookie(c, lucia.sessionCookieName);

    if (!sessionCookie) {
      c.set("user", undefined);
      c.set("session", undefined);
      return unauthorizedError(c);
    }

    const { session, user } = await lucia.validateSession(sessionCookie);

    if (!session) {
      c.set("user", undefined);
      c.set("session", undefined);
      c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
        append: true,
      });
      return unauthorizedError(c);
    }

    if (session.fresh) {
      c.header(
        "Set-Cookie",
        lucia.createSessionCookie(session.id).serialize(),
        { append: true }
      );
    }

    c.set("user", user);
    c.set("session", session);

    await next();
  });
}
