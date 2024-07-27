import type { RegisteredRouterPaths } from "~/types";
import { LayoutDashboardIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SidebarPaths = Extract<RegisteredRouterPaths, "/">;

type SidebarLink = {
  title: string;
  icon: LucideIcon;
  to: SidebarPaths;
  permission: string;
};

export const sidebarLinks = [
  {
    title: "Dashboard",
    icon: LayoutDashboardIcon,
    to: "/",
    permission: "dashboard:read",
  },
] satisfies SidebarLink[];
