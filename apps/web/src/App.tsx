import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { Toaster } from "~/components/ui/sonner";
import { Loader2Icon } from "lucide-react";
import nProgress from "nprogress";
import { authState, useAuthState, useSession } from "./hooks/use-auth";
import { useTheme } from "./hooks/use-theme";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    authState,
  },
  defaultPreload: "intent",
});

router.subscribe("onBeforeLoad", () => {
  nProgress.start();
});

router.subscribe("onResolved", () => {
  nProgress.done();
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <ReactQueryDevtools position="right" />
      <Toaster richColors className="font-sans" position="bottom-right" />
    </QueryClientProvider>
  );
}

function AppRoutes() {
  useSession();
  const authState = useAuthState();

  if (authState.isInitialLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Loader2Icon className="size-10 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <RouterProvider router={router} context={{ queryClient, authState }} />
  );
}
