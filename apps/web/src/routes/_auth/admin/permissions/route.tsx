import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  permissionQuries,
  permissionsSearchSchema,
} from "~/common/keys/permissions";
import { ErrorComponent } from "~/components/error-component";

export const Route = createFileRoute("/_auth/admin/permissions")({
  validateSearch: permissionsSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  beforeLoad: ({ context }) => {
    if (context.authState.user?.role.name !== "ADMIN") {
      throw redirect({
        to: "/",
      });
    }
  },
  shouldReload({ context }) {
    return context.authState.user?.role.name !== "ADMIN";
  },
  loader: async ({ context: { queryClient }, deps: { search } }) => {
    await queryClient.ensureQueryData(
      permissionQuries.list({
        page: search.page,
        perPage: search.perPage,
        name: search.name,
        role: search.role,
      }),
    );
  },
  errorComponent: () => {
    return <ErrorComponent message="Something went wrong" />;
  },
});
