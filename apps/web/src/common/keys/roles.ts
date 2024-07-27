import {
  getAllRolesResponseSchema,
  getPaginatedRolesResponseSchema,
  getPaginatedRolesSearchSchema,
} from "@roles-permissions/schema";
import { queryOptions } from "@tanstack/react-query";
import { api } from "~/utils/api-client";
import { z } from "zod";

export const rolesSearchSchema = z.object({
  name: getPaginatedRolesSearchSchema.shape.name,
  page: getPaginatedRolesSearchSchema.shape.page.catch(1),
  perPage: getPaginatedRolesSearchSchema.shape.perPage.catch(20),
});

export const roleKeys = {
  all: ["roles"] as const,
  list: (values: z.infer<typeof getPaginatedRolesSearchSchema>) =>
    [...roleKeys.all, "list", values] as const,
};

export const roleQuries = {
  all: () =>
    queryOptions({
      queryKey: roleKeys.all,
      queryFn: async () => {
        const res = api.get("roles/all");

        return getAllRolesResponseSchema.parse(await res.json());
      },
      placeholderData: (data) => data,
    }),
  list: (values: z.infer<typeof getPaginatedRolesSearchSchema>) =>
    queryOptions({
      queryKey: roleKeys.list(values),
      queryFn: async () => {
        const searchParams = new URLSearchParams();

        searchParams.set("page", values.page.toString());
        searchParams.set("perPage", values.perPage.toString());

        if (values.name) searchParams.set("name", values.name);

        const res = api.get("roles", {
          searchParams,
        });

        return getPaginatedRolesResponseSchema.parse(await res.json());
      },
      placeholderData: (data) => data,
    }),
};
