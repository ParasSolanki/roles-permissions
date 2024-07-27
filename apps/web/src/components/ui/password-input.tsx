import { cn } from "~/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import React, { useRef } from "react";
import { Button } from "./button";
import { Input } from "./input";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ className, onChange, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const inputEl = parentRef.current?.firstElementChild;

    if (!inputEl) return;

    // on showPassword show original font
    if (showPassword) {
      // @ts-expect-error el has style
      inputEl.style.removeProperty("font-family");
    }

    // not showPassword and has input value change to Verdana font
    // @ts-expect-error input el will have value
    if (!showPassword && inputEl.value) {
      // @ts-expect-error el has style
      inputEl.style.fontFamily = "Verdana";
    }
  }, [showPassword]);

  return (
    <div className="relative" ref={parentRef}>
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        className={cn("pr-11", className)}
        onChange={(e) => {
          // change to Verdana font if has value and type="password"
          if (e.target.value && !showPassword) {
            e.target.style.fontFamily = "Verdana";
          }

          // if no value reset font-family
          if (!e.target.value) {
            e.target.style.removeProperty("font-family");
          }

          onChange?.(e);
        }}
        {...props}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="absolute right-0 top-1/2 -translate-y-1/2"
        onClick={() => setShowPassword((showPassword) => !showPassword)}
      >
        {showPassword && <EyeOffIcon className="h-4 w-4" />}
        {!showPassword && <EyeIcon className="h-4 w-4" />}
      </Button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";
