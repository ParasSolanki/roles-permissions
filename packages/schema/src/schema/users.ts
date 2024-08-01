import { z } from "zod";
import { successSchema } from "../success.js";

export const getAllUsersSearchSchema = z.object({
  name: z.string().optional(),
  cursor: z.coerce.number(z.string()).optional(),
});

export const getAllUsersResponseSchema = successSchema.extend({
  data: z.object({
    users: z
      .object({
        id: z.string(),
        displayName: z.string().nullable(),
        createdAt: z.string(),
      })
      .array(),
    cursor: z.number().optional(),
  }),
});

const SEPARATOR = ",";

export const getPaginatedUsersSearchSchema = z.object({
  name: z.string().optional(),
  role: z
    .string()
    .transform((val, ctx) => {
      if (val.includes(SEPARATOR)) {
        const arr = val
          .split(SEPARATOR)
          .map((s) => s.trim())
          .filter(Boolean);
        if (arr.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `If using ${SEPARATOR} as a separator, provide at least two non-empty values.`,
          });
          return z.NEVER;
        }
        return arr;
      }
      return val;
    })
    .optional(),
  page: z.coerce
    .number(z.string())
    .min(1, "page must be greater than or equal to 1")
    .default(1),
  perPage: z.coerce
    .number(z.string())
    .min(1, "perPage must be greater than or equal to 1")
    .default(20),
});

export const paginatedUsersResponseSchema = successSchema.extend({
  data: z.object({
    users: z
      .object({
        id: z.string(),
        email: z.string(),
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
        role: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .nullable(),
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

export const getUserDetailsResponseSchema = successSchema.extend({
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.string(),
      displayName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
      role: z.object({
        id: z.string(),
        name: z.string(),
      }),
      rolePermissions: z.record(z.string(), z.boolean()),
      userPermissions: z.record(z.string(), z.boolean()),
      createdAt: z.string(),
      updatedAt: z.string().nullable(),
    }),
  }),
});

export const updateUserRoleAndPermissionSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
  permissions: z.record(z.string(), z.boolean()),
});

export const updateUserRoleAndPermissionResponseSchema = successSchema;
