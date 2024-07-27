import { z } from "zod";
import { successSchema } from "../success.js";

export const authSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
    })
    .email(),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, "Password must contain at least 8 character(s)")
    .max(80, "Password can at most contain 80 character(s)"),
});

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  provider: z.string(),
  role: z.object({
    id: z.string(),
    name: z.string(),
  }),
  permissions: z.record(z.string(), z.boolean()),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const authResponseSchema = successSchema.extend({
  data: z.object({
    user: authUserSchema,
  }),
});

export const csrfTokenResponseSchema = successSchema.extend({
  data: z.object({
    csrfToken: z.string(),
  }),
});

export const logoutResponseSchema = successSchema;
