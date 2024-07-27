import { createRoute } from "@hono/zod-openapi";
import {
  getMePermissionsResponseSchema,
  updateMeDisplayNameResponseSchema,
  updateMeDisplayNameSchema,
} from "@roles-permissions/schema";
import {
  badRequestErrorResponse,
  forbiddenErrorResponse,
  internalServerErrorResponse,
  requestTimeoutErrorResponse,
  tooManyRequestsErrorResponse,
  unauthorizedErrorResponse,
} from "../pkg/errors/response.js";

export const updateMeDisplayNameRoute = createRoute({
  path: "/display-name",
  method: "patch",
  tags: ["Me"],
  request: {
    body: {
      description: "Update display name request body",
      content: {
        "application/json": {
          schema: updateMeDisplayNameSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Update user display name",
      content: {
        "application/json": {
          schema: updateMeDisplayNameResponseSchema,
        },
      },
    },
    ...badRequestErrorResponse,
    ...unauthorizedErrorResponse,
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...internalServerErrorResponse,
  },
});

export const getMePermissionsRoute = createRoute({
  path: "/permissions",
  method: "get",
  tags: ["Me"],
  responses: {
    200: {
      description: "Get all my permissions",
      content: {
        "application/json": {
          schema: getMePermissionsResponseSchema,
        },
      },
    },
    ...badRequestErrorResponse,
    ...unauthorizedErrorResponse,
    ...forbiddenErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...internalServerErrorResponse,
  },
});
