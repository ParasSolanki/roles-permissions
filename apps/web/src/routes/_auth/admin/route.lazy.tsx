import { createLazyFileRoute, Link, Outlet } from "@tanstack/react-router";
import { buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import { UserCogIcon, UsersIcon } from "lucide-react";

export const Route = createLazyFileRoute("/_auth/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl font-black">Admin</h1>
        <p className="text-muted-foreground">Admin settings</p>
      </div>

      <Separator className="mt-4" />

      <div className="flex flex-col space-y-4 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 px-4 md:w-1/5">
          <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1">
            <AdminLayoutLinks />
          </nav>
        </aside>
        <div className="flex-1 space-y-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function AdminLayoutLinks() {
  return (
    <ul className="flex lg:flex-col">
      <li>
        <Link
          to="/admin/roles"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full justify-start text-base hover:underline hover:underline-offset-4 data-[status='active']:bg-primary data-[status='active']:text-primary-foreground",
          )}
          search={{
            page: 1,
            perPage: 20,
          }}
        >
          <UsersIcon className="mr-2 size-5 flex-shrink-0" aria-hidden="true" />
          Roles
        </Link>
      </li>
      <li>
        <Link
          to="/admin/permissions"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full justify-start text-base hover:underline hover:underline-offset-4 data-[status='active']:bg-primary data-[status='active']:text-primary-foreground",
          )}
          activeProps={{
            className: "bg-primary",
          }}
          search={{
            page: 1,
            perPage: 20,
          }}
        >
          <UserCogIcon
            className="mr-2 size-5 flex-shrink-0"
            aria-hidden="true"
          />
          Permissions
        </Link>
      </li>
      <li>
        <Link
          to="/admin/users"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full justify-start text-base hover:underline hover:underline-offset-4 data-[status='active']:bg-primary data-[status='active']:text-primary-foreground",
          )}
          search={{
            page: 1,
            perPage: 20,
          }}
        >
          <UsersIcon className="mr-2 size-5 flex-shrink-0" aria-hidden="true" />
          Users
        </Link>
      </li>
    </ul>
  );
}
