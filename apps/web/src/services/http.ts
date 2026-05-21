const envBase = import.meta.env.VITE_API_BASE_URL;
if (!envBase) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Add it to your .env file (see .env.example).",
  );
}
export const apiBaseUrl = envBase;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function http<T>(
  path: string,
  init: RequestInit & { signal?: AbortSignal } = {},
): Promise<T> {
  const url = `${apiBaseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 204) return null as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string; details?: unknown } }).error ?? {};
    throw new ApiError(
      res.status,
      err.code ?? "INTERNAL_ERROR",
      err.message ?? `Request failed with ${res.status}`,
      err.details,
    );
  }
  return body as T;
}
