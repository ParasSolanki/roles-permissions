import { cors } from "hono/cors";
import { csrf } from "./middleware/csrf.js";
import { auth } from "./middleware/auth.js";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { timeout } from "hono/timeout";
import { timing } from "hono/timing";
import { badRequestError, requestTimeoutError } from "./errors/http.js";
import { init } from "./middleware/init.js";
import { PublicEnv } from "./types/types.js";

export function createApp() {
  const app = new OpenAPIHono<PublicEnv>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return badRequestError(c, {
          errors: result.error.flatten().fieldErrors,
        });
      }
    },
  });

  app.onError((err, c) => {
    console.log(err);
    return c.json(
      {
        ok: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      },
      500
    );
  });

  app.use("*", prettyJSON());
  app.use("*", requestId());
  app.use("*", logger());
  app.use("*", init());
  app.use("*", timing());
  app.use("*", secureHeaders());
  app.use(
    "*",
    // @ts-expect-error return json response
    timeout(30_000, (c) => requestTimeoutError(c)) // 30 sec timeout
  );
  app.use("*", csrf());
  app.use(
    "*",
    cors({
      origin: (_, c) => c.env.ALLOWED_ORIGIN,
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  );

  return app;
}

export function createProtectedApp() {
  const app = createApp();
  app.use("*", auth());

  return app;
}