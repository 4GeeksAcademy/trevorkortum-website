/**
 * Minimal auth HTTP helpers for the backoffice Next.js app.
 * Token storage key matches `uis/portal` so sessions can be shared in local dev.
 */

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_INVENTORY_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

export const TOKEN_KEY = "brasaland_token";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function toUserMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Invalid credentials";
    if (err.status >= 500 || err.status === 0) {
      return "Something went wrong on our side. Please try again.";
    }
    return err.message || fallback;
  }
  if (err instanceof TypeError) {
    return "Unable to reach the server. Check your connection and try again.";
  }
  return fallback;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Check your connection and try again.",
      0
    );
  }

  if (res.status === 401 && auth) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("Unauthorized", 401);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data as { detail?: unknown }).detail;
    let message = "";
    if (typeof detail === "string") message = detail;
    else if (Array.isArray(detail)) {
      message = detail
        .map((d: { msg?: string }) => d?.msg)
        .filter((msg): msg is string => Boolean(msg))
        .join("; ");
    }
    throw new ApiError(message || "Request failed. Please try again.", res.status);
  }
  return data as T;
}

export { API_BASE };
