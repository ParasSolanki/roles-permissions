import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/admin")({
  shouldReload({ context }) {
    return context.authState.user?.role?.name !== "ADMIN";
  },
  beforeLoad: ({ context }) => {
    if (context.authState.user?.role?.name !== "ADMIN") {
      throw redirect({
        to: "/",
      });
    }
  },
});
