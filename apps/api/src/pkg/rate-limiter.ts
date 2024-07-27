// import { rateLimiter } from "hono-rate-limiter";
// import { getConnInfo } from "hono/cloudflare-workers";
// import { tooManyRequestsError } from "./errors/http.js";

// export const oneSecondRateLimiter = rateLimiter({
//   windowMs: 1000, // 1 second
//   limit: 2, // Limit each IP to 1 request per `window` (here, per 1 second).
//   standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
//   keyGenerator: (c) => {
//     const info = getConnInfo(c);

//     return info.remote.address ?? "";
//   }, // Method to generate custom identifiers for clients.
//   handler: (c) => tooManyRequestsError(c),
// });

// export const oneMinuteRateLimiter = rateLimiter({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   limit: 60, // Limit each IP to 60 requests per `window` (here, per 1 minute).
//   standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
//   skip: (c) => c.req.method === "OPTIONS",
//   keyGenerator: (c) => {
//     const info = getConnInfo(c);

//     return info.remote.address ?? "";
//   }, // Method to generate custom identifiers for clients.
//   handler: (c) => tooManyRequestsError(c),
// });
