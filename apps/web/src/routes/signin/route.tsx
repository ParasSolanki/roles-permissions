import { createFileRoute, redirect } from "@tanstack/react-router";
import { seo } from "~/utils/seo";
import { z } from "zod";

const searchSchema = z.object({
  redirectUrl: z.string().optional(),
});

export const Route = createFileRoute("/signin")({
  validateSearch: searchSchema,
  beforeLoad: ({ context }) => {
    if (context.authState.isAuthenticated) {
      throw redirect({
        to: "/",
      });
    }
  },
  shouldReload({ context }) {
    return context.authState.isAuthenticated;
  },
  meta: () => {
    return seo({
      title: "Signin | Tetoy",
      description: "Signin page of tetoy",
    });
  },
});
