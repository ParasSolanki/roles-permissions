import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateMeDisplayNameResponseSchema,
  updateUserRoleAndPermissionSchema,
} from "@roles-permissions/schema";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { permissionQuries } from "~/common/keys/permissions";
import { roleQuries } from "~/common/keys/roles";
import { usersKeys, usersQuries } from "~/common/keys/users";
import type { UserDetails } from "~/common/keys/users";
import { Badge } from "~/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { api } from "~/utils/api-client";
import { HTTPError } from "ky";
import { InfoIcon, Loader2Icon, Slash } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createLazyFileRoute("/_auth/admin/users/$userId")({
  component: UserDetailsPage,
});

function UserDetailsPage() {
  const params = Route.useParams();
  const { data, isPending } = useSuspenseQuery(
    usersQuries.details(params.userId),
  );

  const user = data.data.user;

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
      <div className="space-y-4">
        {user.displayName && (
          <h1 className="text-4xl font-black">{user.displayName}</h1>
        )}

        <Separator className="mt-4" />

        {user && (
          <React.Suspense fallback={<UserRolePermissionsLoading />}>
            <UserRolePermissions user={user} />
          </React.Suspense>
        )}
      </div>
    </>
  );
}

function UserRolePermissionsLoading() {
  return Array.from({ length: 5 }, (_, i) => (
    <div
      key={i}
      className="flex flex-col items-start space-y-3 rounded-md border p-4"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-2 h-4 w-44" />
    </div>
  ));
}

function UserRolePermissions({ user }: { user: UserDetails }) {
  const [roleId, setRoleId] = React.useState(user.role.id);
  const queryClient = useQueryClient();
  const { data: roles } = useSuspenseQuery(roleQuries.all());
  const { data: permissions } = useSuspenseQuery(permissionQuries.all());
  const { data: rolePermissions } = useQuery(roleQuries.permissions(roleId));

  const { mutate, isPending } = useMutation({
    mutationKey: ["users", { id: user.id }, "role-permissions", "edit"],
    mutationFn: async (
      values: z.output<typeof updateUserRoleAndPermissionSchema>,
    ) => {
      const res = api.put(`users/${user.id}/role-permissions`, {
        json: values,
      });

      return updateMeDisplayNameResponseSchema.parse(await res.json());
    },
    onSuccess: () => {
      toast.success("User role and permissions updated");
      queryClient.invalidateQueries({ queryKey: usersKeys.details(user.id) });
    },
    onError: async (error) => {
      if (error instanceof HTTPError) {
        const data = await error.response.json();
        if (data.message) toast.error(data.message);
      } else {
        toast.error("Something went wrong while updating role and permissions");
      }
    },
  });

  const rolePermissionsMap = React.useMemo(() => {
    if (!rolePermissions) return {};

    return rolePermissions.data.permissions.reduce<Record<string, boolean>>(
      (all, p) => {
        all[p.name] = true;
        return all;
      },
      {},
    );
  }, [rolePermissions?.data.permissions]);

  const fPermissions = React.useMemo(() => {
    const allPermissions = permissions?.data.permissions;

    if (!allPermissions) return {};

    const allPs = Array.from(
      new Set(Object.keys({ ...rolePermissionsMap, ...user.userPermissions })),
    ).reduce<Record<string, boolean>>((all, p) => {
      all[p] = true;
      return all;
    }, {});

    const per = {} as Record<string, boolean>;

    for (const p of allPermissions) {
      per[p.name] = allPs[p.name] ? true : false;
    }

    return per;
  }, [permissions?.data.permissions, user.userPermissions, rolePermissionsMap]);

  const form = useForm({
    resolver: zodResolver(updateUserRoleAndPermissionSchema),
    values: {
      roleId,
      permissions: fPermissions,
    },
  });

  React.useEffect(() => {
    if (user.role?.id) setRoleId(user.role.id);
  }, [user.role?.id]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutate(values))}>
        <fieldset
          className="space-y-4"
          aria-disabled={isPending}
          disabled={isPending}
        >
          <div className="max-w-2xl">
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={roleId}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setRoleId(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles?.data.roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the desired role for this user. Assigning a new role
                    will update the user's permissions based on the role's
                    assigned permissions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Permissions</h3>
            <ul className="space-y-2">
              {permissions.data.permissions.map((p) => (
                <li key={p.id}>
                  <FormField
                    control={form.control}
                    name={`permissions.${p.name}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!!rolePermissionsMap[p.name]}
                            aria-disabled={!!rolePermissionsMap[p.name]}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {p.name}

                            <TooltipProvider>
                              {user.userPermissions[p.name] && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className="ml-2">
                                      User Specific{" "}
                                      <InfoIcon
                                        className="ml-1 size-4"
                                        aria-hidden="true"
                                      />
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Additional permission given to user
                                      outside of their role permissions
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TooltipProvider>
                          </FormLabel>
                          <FormDescription>{p.description}</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <Button
              type="submit"
              aria-disabled={isPending}
              disabled={isPending}
            >
              {isPending && (
                <Loader2Icon className="mr-1 size-4 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </fieldset>
      </form>
    </Form>
  );
}
