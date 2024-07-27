import { createFileRoute } from "@tanstack/react-router";
import { usersQuries, usersSearchSchema } from "~/common/keys/users";
import { ErrorComponent } from "~/components/error-component";

export const Route = createFileRoute("/_auth/admin/users/")({
  validateSearch: usersSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context: { queryClient }, deps: { search } }) => {
    await queryClient.ensureQueryData(
      usersQuries.list({
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
