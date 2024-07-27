import path from "node:path";
import { fileURLToPath } from "node:url";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { FontaineTransform } from "fontaine";
import million from "million/compiler";
import { defineConfig, loadEnv } from "vite";
import { z } from "zod";

const envSchema = z.object({
  VITE_PUBLIC_API_URL: z.string().url(),
});

const options = {
  fallbacks: ["ui-sans-serif", "Segoe UI", "Arial"],
  resolvePath: (id: string) => new URL("./public" + id, import.meta.url),
};

// https://vitejs.dev/config/
export default defineConfig((params) => {
  const env = loadEnv(
    params.mode,
    path.join(fileURLToPath(new URL(import.meta.url)), ".."),
  );

  const result = envSchema.safeParse(env);

  if (!result.success) throw new Error("Environmental variables are incorrect");
  const parsedEnv = result.data;

  return {
    plugins: [
      million.vite({ auto: false }),
      react(),
      TanStackRouterVite(),
      FontaineTransform.vite(options),
    ],
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: parsedEnv.VITE_PUBLIC_API_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
