import { z } from "zod";
import { successSchema } from "../success.js";

export const getAllRolesResponseSchema = successSchema.extend({
  data: z.object({
    roles: z
      .object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string().nullable(),
      })
      .array(),
  }),
});

export const getRolePermissionsResponseSchema = successSchema.extend({
  data: z.object({
    role: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string().nullable(),
    }),
    permissions: z
      .object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string().nullable(),
      })
      .array(),
  }),
});

export const getPaginatedRolesSearchSchema = z.object({
  name: z.string().optional(),
  page: z.coerce
    .number(z.string())
    .min(1, "page must be greater than or equal to 1")
    .default(1),
  perPage: z.coerce
    .number(z.string())
    .min(1, "perPage must be greater than or equal to 1")
    .default(20),
});

export const getPaginatedRolesResponseSchema = successSchema.extend({
  data: z.object({
    roles: z
      .object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string().nullable(),
      })
      .array(),
    pagination: z.object({
      total: z.number(),
      page: z.number(),
      perPage: z.number(),
    }),
  }),
});

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role is required"),
  description: z.string().max(500).nullable(),
});

export const createRoleResponseSchema = successSchema.extend({
  data: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
  }),
});

export const updateRoleSchema = createRoleSchema;

export const updateRoleResponseSchema = createRoleResponseSchema;

export const deleteRoleResponseSchema = successSchema;
