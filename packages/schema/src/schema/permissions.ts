import { z } from "zod";
import { successSchema } from "../success.js";

export const getAllPermissionsResponseSchema = successSchema.extend({
  data: z.object({
    permissions: z
      .object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
      })
      .array(),
  }),
});

const SEPARATOR = ",";

export const getPaginatedPermissionsSearchSchema = z.object({
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

export const getPaginatedPermissionsResponseSchema = successSchema.extend({
  data: z.object({
    permissions: z
      .object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string().nullable(),
        roles: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .array(),
      })
      .array(),
    pagination: z.object({
      total: z.number(),
      page: z.number(),
      perPage: z.number(),
    }),
  }),
});
