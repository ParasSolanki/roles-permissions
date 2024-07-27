import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema, csrfTokenResponseSchema } from "@roles-permissions/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/ui/password-input";
import { authStore } from "~/hooks/use-auth";
import { api } from "~/utils/api-client";
import { HTTPError } from "ky";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// import { Route as SignupRoute } from "./route";

export const Route = createLazyFileRoute("/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <main className="flex h-screen">
      <div className="hidden h-screen w-6/12 bg-gradient-to-r from-secondary via-accent to-muted lg:block">
        <div className="mx-auto mt-20 max-w-xl px-2">
          <h1 className="px-2 text-5xl font-bold text-foreground">
            Create new account
          </h1>
        </div>
      </div>
      <div className="relative w-full lg:w-6/12">
        <div className="bg-grid absolute inset-0"></div>
        <div className="relative flex h-full items-center">
          <div className="mx-auto w-full max-w-xl space-y-4 px-4">
            <h3 className="text-4xl font-bold text-foreground">Sign Up</h3>

            <SignUpForm />

            <p className="mt-4 text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="font-bold text-secondary-foreground underline underline-offset-4 hover:opacity-80"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

type AuthValues = z.infer<typeof authSchema>;

function SignUpForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // const redirectUrl = SignupRoute.useSearch({
  //   select: (search) => search.redirectUrl,
  // });
  const form = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isPending, mutate } = useMutation({
    mutationKey: ["signin"],
    mutationFn: async (values: AuthValues) => {
      const csrfRes = await api.get("auth/csrf");

      const csrfResData = csrfTokenResponseSchema.parse(await csrfRes.json());

      const res = await api.post("auth/signup", {
        json: {
          email: values.email,
          password: values.password,
        },
        headers: {
          "x-csrf-token": csrfResData.data.csrfToken,
        },
      });

      const data = await res.json();

      return data;
    },
    onSuccess: () => {
      toast.success("Signed up successfully");
    },
    onError: async (error) => {
      if (error instanceof HTTPError) {
        const data = await error.response.json();
        if (data.message) toast.error(data.message);
      } else {
        toast.error("Something went wrong while signup");
      }
    },
  });

  function onSubmit(values: AuthValues) {
    mutate(values, {
      onSuccess: () => {
        authStore.setIsAuthenticated(true);
        queryClient.invalidateQueries({ queryKey: ["session"] });
        navigate({
          to: "/",
        });
      },
    });
  }

  return (
    <Form {...form}>
      <form className="mt-6" onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset disabled={isPending} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Email" type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput {...field} placeholder="Password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Sign Up
          </Button>
        </fieldset>
      </form>
    </Form>
  );
}
