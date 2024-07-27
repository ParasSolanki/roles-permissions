import { createLazyFileRoute, Link, Outlet } from "@tanstack/react-router";
import { buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import type { RegisteredRouterPaths } from "~/types";
import { LockIcon, SunMoonIcon, type LucideIcon } from "lucide-react";

export const Route = createLazyFileRoute("/_auth/_settings")({
  component: SettingsLayout,
});

type SettingsLinkPath = Extract<
  RegisteredRouterPaths,
  "/settings/security" | "/settings/appearance"
>;

type SettingsLink = {
  title: string;
  to: SettingsLinkPath;
  icon: LucideIcon;
};

const settingsLinks = [
  {
    title: "Security",
    to: "/settings/security",
    icon: LockIcon,
  },
  {
    title: "Appearance",
    to: "/settings/appearance",
    icon: SunMoonIcon,
  },
] satisfies SettingsLink[];

function SettingsLayout() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl font-black">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator className="mt-4" />

      <div className="flex flex-col space-y-4 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 px-4 md:w-1/5">
          <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1">
            <SettingsLayoutLinks />
          </nav>
        </aside>
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function SettingsLayoutLinks() {
  return (
    <ul className="flex lg:flex-col">
      {settingsLinks.map((l) => (
        <li key={l.title}>
          <Link
            to={l.to}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "w-full justify-start text-base hover:underline hover:underline-offset-4 data-[status='active']:bg-primary data-[status='active']:text-primary-foreground",
            )}
          >
            <l.icon className="mr-2 h-5 w-5 flex-shrink-0" aria-hidden="true" />

            {l.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
