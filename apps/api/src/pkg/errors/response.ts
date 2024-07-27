import { createRoute, z } from "@hono/zod-openapi";

const errorSchema = z.object({
  ok: z.literal(false),
  message: z.string().openapi({
    description: "A human readable message describing the issue.",
  }),
});

// 400
const badRequestErrorSchema = errorSchema
  .extend({
    code: z.literal("BAD_REQUEST").openapi({
      description: "The error code related to the status code.",
    }),
    errors: z
      .record(
        z.union([z.string(), z.number(), z.symbol()]),
        z.string().array().optional()
      )
      .optional()
      .openapi({
        description: "The map of errors",
      }),
  })
  .openapi("ErrBadRequest​");

// 401
const unauthorizedErrorSchema = errorSchema
  .extend({
    code: z.literal("UNAUTHORIZED").openapi({
      description: "The error code related to the status code.",
    }),
  })
  .openapi("ErrUnauthorized");

// 403
const forbiddenErrorSchema = errorSchema
  .extend({
    code: z.literal("FORBIDDEN").openapi({
      description: "The error code related to the status code.",
    }),
  })
  .openapi("ErrForbidden");

// 404
const notFoundErrorSchema = errorSchema
  .extend({
    code: z.literal("NOT_FOUND").openapi({
      description: "The error code related to the status code.",
    }),
  })
  .openapi("ErrNotFound");

// 408
const requestTimeoutErrorSchema = errorSchema
  .extend({
    code: z.literal("REQUEST_TIMEOUT").openapi({
      description: "The error code related to the status code.",
    }),
  })
  .openapi("ErrRequestTimeout​");

// 409
const conflictErrorSchema = errorSchema
  .extend({
    code: z.literal("CONFLICT").openapi({
      description: "The error code related to the status code.",
    }),
  })
  .openapi("ErrConflict");

// 429
const tooManyRequestsErrorSchema = errorSchema
  .extend({
    code: z.literal("TOO_MANY_REQUESTS").openapi({
      description: "The error code related to the status code.",
    }),
  })
  .openapi("ErrTooManyRequest​");

// 500
const internalServerErrorSchema = errorSchema
  .extend({
    code: z.literal("INTERNAL_SERVER_ERROR").openapi({
      description: "The error code related to the status code.",
    }),
  })
  .openapi("ErrInternalServerError");

type ErrorResponse = Parameters<typeof createRoute>["0"]["responses"];

export const badRequestErrorResponse = {
  400: {
    description:
      "Bad request The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).",
    content: {
      "application/json": {
        schema: badRequestErrorSchema,
      },
    },
  },
} satisfies ErrorResponse;

export const unauthorizedErrorResponse = {
  401: {
    description:
      "The user must authenticate itself to get the requested response.",
    content: {
      "application/json": {
        schema: unauthorizedErrorSchema,
      },
    },
  },
} satisfies ErrorResponse;

export const forbiddenErrorResponse = {
  403: {
    description:
      "Forbidden or The user does not have the necessary permissions to access the resource.",
    content: {
      "application/json": {
        schema: forbiddenErrorSchema,
      },
    },
  },
} satisfies ErrorResponse;

export const notFoundErrorResponse = {
  404: {
    description:
      "The requested resource could not be found or it does not exists",
    content: {
      "application/json": {
        schema: notFoundErrorSchema,
      },
    },
  },
} satisfies ErrorResponse;

export const requestTimeoutErrorResponse = {
  408: {
    description: "Request Timeout",
    content: {
      "application/json": {
        schema: requestTimeoutErrorSchema,
      },
    },
  },
} satisfies ErrorResponse;

export const conflictErrorResponse = {
  409: {
    description:
      "The request could not be completed due to a conflict mainly due to unique constraints.",
    content: {
      "application/json": {
        schema: conflictErrorSchema,
      },
    },
  },
} satisfies ErrorResponse;

export const tooManyRequestsErrorResponse = {
  429: {
    description: "Too many requests",
    content: {
      "application/json": {
        schema: tooManyRequestsErrorSchema,
      },
    },
  },
} satisfies ErrorResponse;

export const internalServerErrorResponse = {
  500: {
    description:
      "The server has encountered a situation it doesn't know how to handle.",
    content: {
      "application/json": {
        schema: internalServerErrorSchema,
      },
    },
  },
} satisfies ErrorResponse;
