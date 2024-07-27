import { createRoute, z } from "@hono/zod-openapi";
import {
  badRequestErrorResponse,
  conflictErrorResponse,
  forbiddenErrorResponse,
  internalServerErrorResponse,
  tooManyRequestsErrorResponse,
  requestTimeoutErrorResponse,
  unauthorizedErrorResponse,
} from "../pkg/errors/response.js";
import {
  authSchema,
  authResponseSchema,
  csrfTokenResponseSchema,
  logoutResponseSchema,
} from "@roles-permissions/schema";

const headersSchema = z.object({
  "x-csrf-token": z
    .string({
      required_error: "Token is required",
    })
    .min(1, "Token is required"),
});

export const signupRoute = createRoute({
  path: "/signup",
  method: "post",
  tags: ["Authorization"],
  request: {
    headers: headersSchema,
    body: {
      description: "Signup request body",
      content: {
        "application/json": {
          schema: authSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Signup user",
      content: {
        "application/json": {
          schema: authResponseSchema,
        },
      },
    },
    ...badRequestErrorResponse,
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...conflictErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...internalServerErrorResponse,
  },
});

export const signinRoute = createRoute({
  path: "/signin",
  method: "post",
  tags: ["Authorization"],
  request: {
    headers: headersSchema,
    body: {
      description: "Signin request body",
      content: {
        "application/json": {
          schema: authSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Signin user",
      content: {
        "application/json": {
          schema: authResponseSchema,
        },
      },
    },
    ...badRequestErrorResponse,
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...internalServerErrorResponse,
  },
});

export const sessionRoute = createRoute({
  path: "/session",
  method: "get",
  tags: ["Authorization"],
  responses: {
    200: {
      description: "Session user",
      content: {
        "application/json": {
          schema: authResponseSchema,
        },
      },
    },
    ...unauthorizedErrorResponse,
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...internalServerErrorResponse,
  },
});

export const signoutRoute = createRoute({
  path: "/signout",
  method: "post",
  tags: ["Authorization"],
  request: {
    headers: headersSchema,
  },
  responses: {
    200: {
      description: "Signout authenticated user",
      content: {
        "application/json": {
          schema: logoutResponseSchema,
        },
      },
    },
    ...unauthorizedErrorResponse,
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...internalServerErrorResponse,
  },
});

export const csrfRoute = createRoute({
  path: "/csrf",
  method: "get",
  tags: ["Authorization"],
  responses: {
    200: {
      description: "Csrf token",
      content: {
        "application/json": {
          schema: csrfTokenResponseSchema,
        },
      },
    },
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...internalServerErrorResponse,
  },
});
