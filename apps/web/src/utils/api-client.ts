import { env } from "~/env";
import ky from "ky";

export const api = ky.create({
  prefixUrl: `${env.VITE_PUBLIC_API_URL}/api`,
  credentials: "include",
  retry: 0,
});
