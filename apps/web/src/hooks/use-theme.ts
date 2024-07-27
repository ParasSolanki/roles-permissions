import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

export type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "light");

  useEffect(() => {
    document.documentElement.classList.add("no-transitions");
    document.documentElement.classList.remove("light", "dark");

    if (theme === "light") document.documentElement.classList.add("light");
    if (theme === "dark") document.documentElement.classList.add("dark");

    setTimeout(() => {
      document.documentElement.classList.remove("no-transitions");
    });
  }, [theme]);

  return [theme, setTheme] as const;
}
