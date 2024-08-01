import { useQuery } from "@tanstack/react-query";
import { meQuries } from "~/common/keys/me";
import type { AuthMe } from "~/common/keys/me";
import { HTTPError } from "ky";
import { useSyncExternalStore } from "react";

type SubscribeListener = () => void;

let listeners = [] as Array<SubscribeListener>;
export type AuthState = {
  isAuthenticated: boolean;
  isInitialLoading: boolean;
  user: AuthMe | undefined;
};

export const authState = {
  isAuthenticated: false,
  isInitialLoading: true,
  user: undefined,
} as AuthState;

export const authStore = {
  setIsInitialLoading(isInitialLoading: AuthState["isInitialLoading"]) {
    authState.isInitialLoading = isInitialLoading;
    emitChange();
  },
  setIsAuthenticated(isAuthenticated: AuthState["isAuthenticated"]) {
    authState.isAuthenticated = isAuthenticated;
    emitChange();
  },
  setUser(user: AuthState["user"]) {
    authState.user = user;
    emitChange();
  },
  subscribe(listener: SubscribeListener) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  getSnapshot() {
    return authState;
  },
};

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function useAuthState() {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
}

export function useSession() {
  const authState = useAuthState();
  const session = useQuery(meQuries.session());

  if (session.data) {
    const user = {
      ...session.data.data.user,
      permissions: {
        ...session.data.data.user.rolePermissions,
        ...session.data.data.user.userPermissions,
      },
    };
    authStore.setIsAuthenticated(true);
    authStore.setUser(user);
  }

  // unauthorized
  if (
    session.error &&
    authState.isAuthenticated &&
    session.error instanceof HTTPError
  ) {
    authStore.setIsAuthenticated(false);
    authStore.setUser(undefined);
    window.location.href = "/signin";
  }

  if (authState.isInitialLoading) {
    authStore.setIsInitialLoading(session.isLoading);
  }

  if (session.isError) {
    authStore.setIsInitialLoading(false);
  }

  return session;
}

export function usePermissions() {
  const authState = useAuthState();

  const permissions = authState.user?.permissions ?? {};

  function hasPermission(permission: string) {
    return permissions[permission];
  }
  function hasPermissions(permissions: Array<string>) {
    return permissions.every((p) => hasPermission(p));
  }

  return { permissions, hasPermission, hasPermissions };
}
