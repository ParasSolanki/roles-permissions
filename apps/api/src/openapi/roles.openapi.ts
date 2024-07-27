import { createRoute, z } from "@hono/zod-openapi";
import {
  badRequestErrorResponse,
  forbiddenErrorResponse,
  internalServerErrorResponse,
  requestTimeoutErrorResponse,
  tooManyRequestsErrorResponse,
  unauthorizedErrorResponse,
} from "../pkg/errors/response.js";
import {
  createRoleResponseSchema,
  createRoleSchema,
  deleteRoleResponseSchema,
  getAllRolesResponseSchema,
  getPaginatedRolesResponseSchema,
  getPaginatedRolesSearchSchema,
  getRolePermissionsResponseSchema,
  updateRoleResponseSchema,
  updateRoleSchema,
} from "@roles-permissions/schema";

const roleIdSchema = z.string().openapi({
  param: {
    name: "id",
    in: "path",
  },
  example: "HlvsNXaqKZit4lfE2cROU",
});

export const getAllRolesRoute = createRoute({
  path: "/all",
  method: "get",
  tags: ["Roles"],
  responses: {
    200: {
      description: "Get all roles",
      content: {
        "application/json": {
          schema: getAllRolesResponseSchema,
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

export const getPaginatedRolesRoute = createRoute({
  path: "/",
  method: "get",
  tags: ["Roles"],
  request: {
    query: getPaginatedRolesSearchSchema,
  },
  responses: {
    200: {
      description: "Get paginated roles with name search",
      content: {
        "application/json": {
          schema: getPaginatedRolesResponseSchema,
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

export const createRoleRoute = createRoute({
  path: "/",
  method: "post",
  tags: ["Roles"],
  request: {
    body: {
      description: "Create role body",
      content: {
        "application/json": {
          schema: createRoleSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Create role",
      content: {
        "application/json": {
          schema: createRoleResponseSchema,
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

export const updateRoleRoute = createRoute({
  path: "/{id}",
  method: "put",
  tags: ["Roles"],
  request: {
    params: z.object({
      id: roleIdSchema,
    }),
    body: {
      description: "Update role body",
      content: {
        "application/json": {
          schema: updateRoleSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Update role data",
      content: {
        "application/json": {
          schema: updateRoleResponseSchema,
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

export const deleteRoleRoute = createRoute({
  path: "/{id}",
  method: "delete",
  tags: ["Roles"],
  request: {
    params: z.object({
      id: roleIdSchema,
    }),
  },
  responses: {
    200: {
      description: "Delete role",
      content: {
        "application/json": {
          schema: deleteRoleResponseSchema,
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

export const getRolePermissionsRoute = createRoute({
  path: "/{id}/permissions",
  method: "get",
  tags: ["Roles"],
  request: {
    params: z.object({
      id: roleIdSchema,
    }),
  },
  responses: {
    200: {
      description: "Get role permissions",
      content: {
        "application/json": {
          schema: getRolePermissionsResponseSchema,
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
