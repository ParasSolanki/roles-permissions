import {
  getAllUsersResponseSchema,
  getAllUsersSearchSchema,
  getPaginatedUsersSearchSchema,
  getUserDetailsResponseSchema,
  paginatedUsersResponseSchema,
} from "@roles-permissions/schema";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { api } from "~/utils/api-client";
import { z } from "zod";

export const usersSearchSchema = z.object({
  name: getPaginatedUsersSearchSchema.shape.name,
  role: getPaginatedUsersSearchSchema.shape.role,
  page: getPaginatedUsersSearchSchema.shape.page.catch(1),
  perPage: getPaginatedUsersSearchSchema.shape.perPage.catch(20),
});

export const userIdSchema = z.string();

export type UserDetails = z.output<
  typeof getUserDetailsResponseSchema
>["data"]["user"];

export const usersKeys = {
  all: ["users"] as const,
  list: (values: z.infer<typeof getPaginatedUsersSearchSchema>) =>
    [...usersKeys.all, "list", values] as const,
  infinite: (values: z.infer<typeof getAllUsersSearchSchema>) =>
    [...usersKeys.all, "infinite", values] as const,
  details: (id: z.infer<typeof userIdSchema>) =>
    [...usersKeys.all, "details", { id }] as const,
};

export const usersQuries = {
  list: (values: z.infer<typeof getPaginatedUsersSearchSchema>) =>
    queryOptions({
      queryKey: usersKeys.list(values),
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

        const res = await api.get("users", {
          searchParams,
        });

        return paginatedUsersResponseSchema.parse(await res.json());
      },
      placeholderData: (data) => data,
    }),
  infinite: (values: z.infer<typeof getAllUsersSearchSchema>) =>
    infiniteQueryOptions({
      queryKey: usersKeys.infinite(values),
      queryFn: async ({ pageParam }) => {
        const searchParams = new URLSearchParams();

        if (pageParam) searchParams.set("cursor", pageParam.toString());

        const res = await api.get(`users/all`, {
          searchParams,
        });

        return getAllUsersResponseSchema.parse(await res.json());
      },
      initialPageParam: 0,
      getPreviousPageParam: (firstPage) => firstPage.data.cursor ?? undefined,
      getNextPageParam: (lastPage) => lastPage.data.cursor ?? undefined,
    }),
  details: (id: z.infer<typeof userIdSchema>) =>
    queryOptions({
      queryKey: usersKeys.details(id),
      queryFn: async () => {
        const res = await api.get(`users/${id}`).json();

        return getUserDetailsResponseSchema.parse(res);
      },
    }),
};
