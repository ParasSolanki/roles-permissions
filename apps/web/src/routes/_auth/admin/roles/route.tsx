import { createFileRoute, redirect } from "@tanstack/react-router";
import { roleQuries, rolesSearchSchema } from "~/common/keys/roles";
import { ErrorComponent } from "~/components/error-component";

export const Route = createFileRoute("/_auth/admin/roles")({
  validateSearch: rolesSearchSchema,
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
      roleQuries.list({
        page: search.page,
        perPage: search.perPage,
        name: search.name,
      }),
    );
  },
  errorComponent: () => {
    return <ErrorComponent message="Something went wrong" />;
  },
});
