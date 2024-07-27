import { createFileRoute, redirect } from "@tanstack/react-router";
import { seo } from "~/utils/seo";
import { z } from "zod";

const searchSchema = z.object({
  redirectUrl: z.string().optional(),
});

export const Route = createFileRoute("/signup")({
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => {
    if (context.authState.isAuthenticated) {
      throw redirect({
        to: "/",
      });
    }
  },
  meta: () => {
    return seo({
      title: "Signup | Tetoy",
      description: "Signup page of tetoy",
    });
  },
});
