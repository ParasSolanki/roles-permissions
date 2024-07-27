import { createFileRoute } from "@tanstack/react-router";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/_auth/")({
  meta: () => {
    return seo({
      title: "Dashboard | Tetoy",
      description: "Dashboard tetoy",
    });
  },
});
