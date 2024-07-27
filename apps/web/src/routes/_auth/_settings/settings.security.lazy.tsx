import { createLazyFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { PasswordInput } from "~/components/ui/password-input";
import { Separator } from "~/components/ui/separator";

export const Route = createLazyFileRoute("/_auth/_settings/settings/security")({
  component: PasswordPage,
});

function PasswordPage() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-3xl font-semibold ">Security</h3>
        <p className="text-muted-foreground">Update your account settings.</p>
      </div>
      <Separator className="mt-4" />

      <form>
        <fieldset>
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:flex sm:space-x-6 sm:space-y-0">
              <div className="w-full sm:w-6/12 md:w-4/12">
                <Label htmlFor="old-password">Old Password</Label>
                <PasswordInput id="old-password" placeholder="Old Password" />
              </div>
              <div className="w-full sm:w-6/12 md:w-4/12">
                <Label htmlFor="new-password">New Password</Label>
                <PasswordInput id="new-password" placeholder="New Password" />
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between space-x-3 border-t bg-muted py-4">
              <p className="text-base text-muted-foreground">
                Password does require minimum 8 and maximum 256 characters.
              </p>
              <Button type="submit" size="sm">
                Save
              </Button>
            </CardFooter>
          </Card>
        </fieldset>
      </form>
    </div>
  );
}
