import type { AppType } from "api/app";
import { hc } from "hono/client";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const api = hc<AppType>(API_URL);

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
