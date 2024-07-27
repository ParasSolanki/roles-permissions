import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { usersQuries } from "~/common/keys/users";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Skeleton } from "~/components/ui/skeleton";
import { Slash } from "lucide-react";

export const Route = createLazyFileRoute("/_auth/admin/users/$userId")({
  component: UserDetailsPage,
});

function UserDetailsPage() {
  const params = Route.useParams();
  const { data, isPending } = useQuery(usersQuries.details(params.userId));

  console.log(data);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <Slash />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin/users" search={{ page: 1, perPage: 20 }}>
                Users
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <Slash />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            {isPending && !data && <Skeleton className="h-4 w-20" />}
            {!isPending && data?.data.user.id && (
              <BreadcrumbPage>{data.data.user.id}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
