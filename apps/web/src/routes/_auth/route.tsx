import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (!context.authState.isAuthenticated) {
      throw redirect({
        to: "/signin",
        search: {
          redirectUrl: location.href,
        },
      });
    }
  },
  shouldReload({ context }) {
    return !context.authState.isAuthenticated;
  },
});
