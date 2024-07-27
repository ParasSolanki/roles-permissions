import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/admin/users")({
  beforeLoad: ({ context }) => {
    if (!context.authState.user?.permissions["users:read"]) {
      throw redirect({
        to: "/",
      });
    }
  },
  shouldReload({ context }) {
    return !context.authState.user?.permissions["users:read"];
  },
});
