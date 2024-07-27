import { z } from "zod";

export const successSchema = z.object({
  ok: z.literal(true),
});
