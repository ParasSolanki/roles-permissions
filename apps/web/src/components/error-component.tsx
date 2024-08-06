import { cn } from "~/lib/utils";
import { Button } from "./ui/button";

export function ErrorComponent({
  message,
  className,
  reset,
}: {
  message: string;
  className?: string;
  reset?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-32 w-full flex-col items-center justify-center border-2 border-dashed border-destructive/70 p-2",
        className,
      )}
    >
      <span className="text-lg font-bold text-destructive">Oh Snap!</span>
      <p className="text-base font-medium text-destructive/90">{message}</p>
      {reset && (
        <Button type="button" variant="destructive" size="sm" onClick={reset}>
          Retry
        </Button>
      )}
    </div>
  );
}
