import {
  getAllPermissionsResponseSchema,
  getPaginatedPermissionsResponseSchema,
  getPaginatedPermissionsSearchSchema,
} from "@roles-permissions/schema";
import { queryOptions } from "@tanstack/react-query";
import { api } from "~/utils/api-client";
import { z } from "zod";

export const permissionsSearchSchema = z.object({
  name: getPaginatedPermissionsSearchSchema.shape.name,
  role: getPaginatedPermissionsSearchSchema.shape.role,
  page: getPaginatedPermissionsSearchSchema.shape.page.catch(1),
  perPage: getPaginatedPermissionsSearchSchema.shape.perPage.catch(20),
});

export const permissionKeys = {
  all: ["permissions"] as const,
  list: (values: z.infer<typeof permissionsSearchSchema>) =>
    [...permissionKeys.all, "list", values] as const,
};

export const permissionQuries = {
  all: () =>
    queryOptions({
      queryKey: permissionKeys.all,
      queryFn: async () => {
        const res = api.get("permissions/all");

        return getAllPermissionsResponseSchema.parse(await res.json());
      },
      placeholderData: (data) => data,
    }),
  list: (values: z.infer<typeof permissionsSearchSchema>) =>
    queryOptions({
      queryKey: permissionKeys.list(values),
      queryFn: async () => {
        const searchParams = new URLSearchParams();

        searchParams.set("page", values.page.toString());
        searchParams.set("perPage", values.perPage.toString());

        if (values.name) searchParams.set("name", values.name);

        if (values.role) {
          searchParams.set(
            "role",
            Array.isArray(values.role) ? values.role.join(",") : values.role,
          );
        }

        const res = api.get("permissions", {
          searchParams,
        });

        return getPaginatedPermissionsResponseSchema.parse(await res.json());
      },
      placeholderData: (data) => data,
    }),
};
