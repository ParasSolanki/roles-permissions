import { createRoute, z } from "@hono/zod-openapi";
import {
  badRequestErrorResponse,
  forbiddenErrorResponse,
  internalServerErrorResponse,
  notFoundErrorResponse,
  requestTimeoutErrorResponse,
  tooManyRequestsErrorResponse,
  unauthorizedErrorResponse,
} from "../pkg/errors/response.js";
import {
  getAllUsersResponseSchema,
  getAllUsersSearchSchema,
  getPaginatedUsersSearchSchema,
  getUserDetailsResponseSchema,
  paginatedUsersResponseSchema,
} from "@roles-permissions/schema";

const userIdSchema = z.string().openapi({
  param: {
    name: "id",
    in: "path",
  },
  example: "HlvsNXaqKZit4lfE2cROU",
});

export const getAllUsersRoute = createRoute({
  path: "/all",
  method: "get",
  tags: ["Users"],
  request: {
    query: getAllUsersSearchSchema,
  },
  responses: {
    200: {
      description: "Get all users with cursor pagination and search",
      content: {
        "application/json": {
          schema: getAllUsersResponseSchema,
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

export const getPaginatedUsersRoute = createRoute({
  path: "/",
  method: "get",
  tags: ["Users"],
  request: {
    query: getPaginatedUsersSearchSchema,
  },
  responses: {
    200: {
      description: "Get paginated users",
      content: {
        "application/json": {
          schema: paginatedUsersResponseSchema,
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

export const getUserDetailsRoute = createRoute({
  path: "/{id}",
  method: "get",
  tags: ["Users"],
  request: {
    params: z.object({
      id: userIdSchema,
    }),
  },
  responses: {
    200: {
      description: "Get user details",
      content: {
        "application/json": {
          schema: getUserDetailsResponseSchema,
        },
      },
    },
    ...badRequestErrorResponse,
    ...unauthorizedErrorResponse,
    ...forbiddenErrorResponse,
    ...notFoundErrorResponse,
    ...requestTimeoutErrorResponse,
    ...tooManyRequestsErrorResponse,
    ...internalServerErrorResponse,
  },
});
