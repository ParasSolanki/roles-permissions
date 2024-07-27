import { z } from "zod";
import { successSchema } from "../success.js";

export const updateMeDisplayNameSchema = z.object({
  displayName: z
    .string({ required_error: "Display name is required" })
    .min(1, "Display name is required")
    .max(32, "Display name can at most contain 32 character(s)"),
});

export const updateMeDisplayNameResponseSchema = successSchema;

export const getMePermissionsResponseSchema = successSchema.extend({
  data: z.object({
    permissions: z.record(z.string(), z.boolean()),
  }),
});
