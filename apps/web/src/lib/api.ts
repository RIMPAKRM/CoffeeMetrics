import type { AppType } from "api/app";
import { hc } from "hono/client";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// In the browser we go through the same-origin /api/* rewrite in next.config.
// Outside the browser (SSR edge cases) hit the API directly.
const baseUrl =
  typeof window === "undefined" ? API_URL : window.location.origin;

export const api = hc<AppType>(baseUrl);

/** Unwrap the { data } / { error } envelope used across the API. */
export async function unwrap<T>(
  res: PromiseLike<Response> | Response,
): Promise<T> {
  const response = await res;
  const body = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { message: string };
  } | null;
  if (!response.ok || !body || body.data === undefined) {
    throw new Error(
      body?.error?.message ?? `Ошибка запроса (${response.status})`,
    );
  }
  return body.data;
}
