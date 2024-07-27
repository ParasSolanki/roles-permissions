import { createApp } from "./pkg/app.js";
import { Env } from "hono";
import { ExecutionContext } from "@cloudflare/workers-types";
import { env as zEnv } from "./pkg/env.js";
import { apiReference } from "@scalar/hono-api-reference";
import { route as authRoutes } from "./routes/auth.route.js";
import { route as meRoutes } from "./routes/me.route.js";
import { route as roleRoutes } from "./routes/roles.route.js";
import { route as permissionRoutes } from "./routes/permissions.route.js";
import { route as userRoutes } from "./routes/users.route.js";

const app = createApp()
  .doc31("/doc", {
    openapi: "3.1.0",
    info: {
      version: "1.0.0",
      title: "Roles and Permission API Docs",
    },
  })
  .get(
    "/docs",
    apiReference({
      pageTitle: "Roles and Permission API Docs",
      spec: {
        url: "/doc",
      },
    })
  )
  .route("/api/auth", authRoutes)
  .route("/api/me", meRoutes)
  .route("/api/roles", roleRoutes)
  .route("/api/permissions", permissionRoutes)
  .route("/api/users", userRoutes);

const handler = {
  fetch: (req: Request, env: Env, executionCtx: ExecutionContext) => {
    const parsedEnv = zEnv.safeParse(env);
    if (!parsedEnv.success) {
      return Response.json(
        {
          code: "BAD_ENVIRONMENT",
          message: "Some environment variables are missing or are invalid",
          errors: parsedEnv.error,
        },
        { status: 500 }
      );
    }

    return app.fetch(req, parsedEnv.data, executionCtx);
  },
} satisfies ExportedHandler<Env>;

export default handler;
