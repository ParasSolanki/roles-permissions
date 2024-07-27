import { zodResolver } from "@hookform/resolvers/zod";
import { updateMeDisplayNameSchema } from "@roles-permissions/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { useSession } from "~/hooks/use-auth";
import { api } from "~/utils/api-client";
import { HTTPError } from "ky";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createLazyFileRoute("/_auth/_profile/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data } = useSession();

  if (!data) return "No user";

  const user = data.data.user;

  return (
    <div className="mb-4 space-y-4">
      <div>
        <h3 className="text-3xl font-semibold">General</h3>
        <p className="text-muted-foreground">Update your profile settings.</p>
      </div>
      <Separator className="mt-4" />

      <DisplayNameForm displayName={user.displayName} />
    </div>
  );
}

type DisplayNameValues = z.infer<typeof updateMeDisplayNameSchema>;

function DisplayNameForm(props: { displayName: string | null }) {
  const queryClient = useQueryClient();
  const form = useForm<DisplayNameValues>({
    resolver: zodResolver(updateMeDisplayNameSchema),
    values: {
      displayName: props.displayName ?? "",
    },
  });
  const { isPending, mutate } = useMutation({
    mutationKey: ["me", "display-name"],
    mutationFn: async (values: DisplayNameValues) => {
      const res = await api.patch("me/display-name", {
        json: {
          displayName: values.displayName,
        },
      });

      return await res.json();
    },
    onSuccess: () => {
      toast.success("Display name updated");
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: async (error) => {
      if (error instanceof HTTPError) {
        const data = await error.response.json();
        if (data.message) toast.error(data.message);
      } else {
        toast.error("Something went wrong while updating display name");
      }
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          mutate(values);
        })}
      >
        <fieldset disabled={isPending} aria-disabled={isPending}>
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Display Name</CardTitle>
              <CardDescription>
                Please enter your full name, or a display name you are
                comfortable with.
              </CardDescription>
            </CardHeader>
            <CardContent className="w-96">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Display Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t bg-primary-foreground py-4">
              <p className="text-base text-muted-foreground">
                Please use 32 characters at maximum.
              </p>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                aria-disabled={isPending}
              >
                {isPending && (
                  <Loader2Icon className="mr-1 size-4 animate-spin" />
                )}
                Save
              </Button>
            </CardFooter>
          </Card>
        </fieldset>
      </form>
    </Form>
  );
}
