import { csrfTokenResponseSchema } from "@roles-permissions/schema";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import avatar from "~/assets/images/avatar.png";
import { authStore, useSession } from "~/hooks/use-auth";
import { api } from "~/utils/api-client";
import { HTTPError } from "ky";
import {
  LogOutIcon,
  SettingsIcon,
  ShieldIcon,
  User2Icon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function UserMenu() {
  const { data } = useSession();

  const { mutate, isPending } = useMutation({
    mutationKey: ["signout"],
    mutationFn: async () => {
      const csrfRes = await api.get("auth/csrf");

      const csrfResData = csrfTokenResponseSchema.parse(await csrfRes.json());

      const res = await api.post("auth/signout", {
        headers: {
          "x-csrf-token": csrfResData.data.csrfToken,
        },
      });

      const data = await res.json();

      return data;
    },
    onSuccess: () => {
      toast.success("Signed in successfully");
    },
    onError: async (error) => {
      if (error instanceof HTTPError) {
        const data = await error.response.json();
        if (data.message) toast.error(data.message);
      } else {
        toast.error("Something went wrong while signing");
      }
    },
  });

  function handleSignout() {
    mutate(undefined, {
      onSuccess() {
        authStore.setIsAuthenticated(false);
        window.location.href = "/signin";
      },
    });
  }

  const user = data?.data.user;

  const isAdmin = user?.role?.name === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center">
          <Avatar className="size-8">
            <AvatarImage
              src={avatar}
              alt="Profile pic"
              width={35}
              height={35}
            />
            <AvatarFallback className="text-foreground">
              <User2Icon className="size-4" />
            </AvatarFallback>
          </Avatar>
          {!!user?.displayName && (
            <span className="ml-2 text-base font-semibold">
              {user?.displayName}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <UserIcon className="mr-2 size-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link to="/admin">
                <ShieldIcon className="mr-2 size-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link to="/settings/security">
              <SettingsIcon className="mr-2 size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-500 hover:cursor-pointer hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white"
          onSelect={handleSignout}
          disabled={isPending}
          aria-disabled={isPending}
        >
          <LogOutIcon className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
