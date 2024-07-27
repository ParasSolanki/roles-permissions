import { createRoute } from "@hono/zod-openapi";
import {
  badRequestErrorResponse,
  forbiddenErrorResponse,
  internalServerErrorResponse,
  requestTimeoutErrorResponse,
  tooManyRequestsErrorResponse,
  unauthorizedErrorResponse,
} from "../pkg/errors/response.js";
import {
  getAllPermissionsResponseSchema,
  getPaginatedPermissionsResponseSchema,
  getPaginatedPermissionsSearchSchema,
} from "@roles-permissions/schema";

export const getAllPermissionsRoute = createRoute({
  path: "/all",
  method: "get",
  tags: ["Permissions"],
  responses: {
    200: {
      description: "Get all permissions",
      content: {
        "application/json": {
          schema: getAllPermissionsResponseSchema,
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

export const getPaginatedPermissionsRoute = createRoute({
  path: "/",
  method: "get",
  tags: ["Permissions"],
  request: {
    query: getPaginatedPermissionsSearchSchema,
  },
  responses: {
    200: {
      description: "Get paginated permissions with name and role search",
      content: {
        "application/json": {
          schema: getPaginatedPermissionsResponseSchema,
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
