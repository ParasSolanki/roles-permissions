import {
  authResponseSchema,
  getMePermissionsResponseSchema,
} from "@roles-permissions/schema";
import { queryOptions } from "@tanstack/react-query";
import { api } from "~/utils/api-client";
import { z } from "zod";

export const meKeys = {
  all: ["me"] as const,
  session: () => [...meKeys.all, "session"] as const,
  permissions: () => [...meKeys.all, "permissions"] as const,
};

export type AuthMe = z.output<typeof authResponseSchema>["data"]["user"];

export const meQuries = {
  session: () =>
    queryOptions({
      queryKey: meKeys.session(),
      queryFn: async () => {
        const res = await api.get("auth/session");

        return authResponseSchema.parse(await res.json());
      },
      retry: 1,
    }),
  permissions: () =>
    queryOptions({
      queryKey: meKeys.permissions(),
      queryFn: async () => {
        const res = await api.get("me/permissions");

        return getMePermissionsResponseSchema.parse(await res.json());
      },
    }),
};
