import type { ParseRoute, RegisteredRouter } from "@tanstack/react-router";

export type RegisteredRouterPaths = ParseRoute<
  RegisteredRouter["routeTree"]
>["fullPath"];
