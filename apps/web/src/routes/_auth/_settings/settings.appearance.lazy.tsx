import { createLazyFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Separator } from "~/components/ui/separator";
import { Theme, useTheme } from "~/hooks/use-theme";

export const Route = createLazyFileRoute(
  "/_auth/_settings/settings/appearance",
)({
  component: AppearancePage,
});

function AppearancePage() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-3xl font-semibold">Appearance</h3>
        <p className="text-muted-foreground">
          Customize the appearance of the app. Automatically switch between
          light and dark themes.
        </p>
      </div>
      <Separator className="mt-4" />

      <AppearanceForm />
    </div>
  );
}

function AppearanceForm() {
  const [theme, setTheme] = useTheme();
  return (
    <form>
      <fieldset>
        <div>
          <Label htmlFor="theme">Theme</Label>
          <p className="text-sm text-muted-foreground">
            Select the theme for the dashboard.
          </p>

          <RadioGroup
            defaultValue={theme}
            onValueChange={(t: Theme) => setTheme(t)}
            className="grid max-w-md grid-cols-2 gap-8 pt-2"
          >
            <div>
              <label className="[&:has([data-state=checked])>div]:border-primary">
                <div>
                  <RadioGroupItem value="light" className="sr-only" />
                </div>
                <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                  <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  Light
                </span>
              </label>
            </div>
            <div>
              <label className="[&:has([data-state=checked])>div]:border-primary">
                <div>
                  <RadioGroupItem value="dark" className="sr-only" />
                </div>
                <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                  <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  Dark
                </span>
              </label>
            </div>
          </RadioGroup>
        </div>

        <Button type="submit">Save</Button>
      </fieldset>
    </form>
  );
}
