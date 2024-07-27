import type { PublicContext as Context } from "../types/types.js";

interface RequestError {
  message?: string;
}

type Errors = {
  [x: string]: string[] | undefined;
  [x: number]: string[] | undefined;
  [x: symbol]: string[] | undefined;
};

interface BadRequestError extends RequestError {
  errors?: Errors;
}

export function badRequestError(c: Context, error?: BadRequestError) {
  return c.json(
    {
      ok: false,
      code: "BAD_REQUEST",
      message: error?.message ?? "Wrong data passed",
      errors: error?.errors,
    },
    400
  );
}

export function unauthorizedError(c: Context, error?: RequestError) {
  return c.json(
    {
      ok: false,
      code: "UNAUTHORIZED",
      message: error?.message ?? "Not authorized",
    },
    401
  );
}

export function forbiddenError(c: Context, error?: RequestError) {
  return c.json(
    {
      ok: false,
      code: "FORBIDDEN",
      message: error?.message ?? "Forbidden",
    },
    403
  );
}

export function notFoundError(c: Context, message: string) {
  return c.json(
    {
      ok: false,
      code: "NOT_FOUND",
      message,
    },
    404
  );
}

export function requestTimeoutError(c: Context) {
  return c.json(
    {
      ok: false,
      code: "REQUEST_TIMEOUT",
      message: "Request timed out",
    },
    408
  );
}

export function conflictError(c: Context, error: { message: string }) {
  return c.json(
    {
      ok: false,
      code: "CONFLICT",
      message: error.message,
    },
    409
  );
}

export function tooManyRequestsError(c: Context) {
  return c.json(
    {
      ok: false,
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests, please try again later",
    },
    429
  );
}

export function internalServerError(c: Context, error?: RequestError) {
  return c.json(
    {
      ok: false,
      code: "INTERNAL_SERVER_ERROR",
      message: error?.message ?? "Something went wrong",
    },
    500
  );
}
