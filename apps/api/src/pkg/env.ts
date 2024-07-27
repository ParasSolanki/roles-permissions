import { z } from "zod";

export const environment = z
  .enum(["development", "preview", "canary", "production"])
  .default("development");

export const env = z.object({
  ENVIRONMENT: environment,
  HOSTNAME: z.string().min(1),
  ALLOWED_ORIGIN: z.string().url(),
  TOKEN_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DATABASE_AUTH_TOKEN: z.string().min(1),
});
export type ENV = z.infer<typeof env>;

export type Environment = z.infer<typeof environment>;
