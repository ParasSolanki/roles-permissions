import { createFileRoute, redirect } from "@tanstack/react-router";
import { usersQuries } from "~/common/keys/users";
import { ErrorComponent } from "~/components/error-component";
import { HTTPError } from "ky";

export const Route = createFileRoute("/_auth/admin/users/$userId")({
  beforeLoad: ({ context }) => {
    if (
      !context.authState.user?.permissions["users:read"] &&
      !context.authState.user?.permissions["users:edit"]
    ) {
      throw redirect({
        to: "/",
      });
    }
  },
  shouldReload({ context }) {
    return (
      !context.authState.user?.permissions["users:read"] &&
      !context.authState.user?.permissions["users:edit"]
    );
  },
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(usersQuries.details(params.userId));
  },
  errorComponent: ({ error }) => {
    const message =
      error instanceof HTTPError && error.response.status === 404
        ? "User does not exists"
        : "Something went wrong";

    return <ErrorComponent message={message} />;
  },
});
