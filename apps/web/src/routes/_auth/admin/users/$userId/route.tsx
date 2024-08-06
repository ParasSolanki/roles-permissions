import { createFileRoute, redirect } from "@tanstack/react-router";
import { usersQuries } from "~/common/keys/users";
import { ErrorComponent } from "~/components/error-component";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
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
  pendingComponent: () => {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-8 w-40" />
        <Separator />

        <div className="space-y-4">
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
    );
  },
  wrapInSuspense: true,
});
