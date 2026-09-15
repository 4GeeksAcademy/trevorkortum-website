const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
const TOKEN_KEY = "brasaland_token";

const SAFE_API_DETAILS = new Set([
  "Invalid credentials",
  "Not authenticated",
  "Invalid or expired token",
  "Invalid or expired reset token",
  "Reset token already used or expired",
  "Current password is incorrect",
  "Password updated.",
  "Password changed.",
  "If that email exists, a reset link has been sent.",
  "Unable to create account with the provided details",
  "Profile not found",
  "User not found",
  "Admin only",
  "Forbidden",
  "Unauthorized",
  "Database temporarily unavailable",
  "CSV file is missing a header row",
  "CSV file contains no data rows",
  "CSV is missing required columns",
  "Unable to analyze the CSV file",
  "Sample dataset is not available.",
  "No analysis results available.",
]);

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

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Map API/network failures to short user-facing copy. */
export function toUserMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (SAFE_API_DETAILS.has(err.message)) return err.message;
    if (err.status === 401) return "Please sign in again.";
    if (err.status === 403) return "You do not have permission to do that.";
    if (err.status === 404) return "The requested resource was not found.";
    if (err.status === 0 || err.status >= 500) {
      return "Something went wrong on our side. Please try again.";
    }
    return fallback;
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
    let rawMessage = "";
    if (typeof detail === "string") {
      rawMessage = detail;
    } else if (Array.isArray(detail)) {
      rawMessage = detail
        .map((d: { msg?: string }) => d?.msg)
        .filter((msg): msg is string => Boolean(msg))
        .join("; ");
    }

    const message = SAFE_API_DETAILS.has(rawMessage)
      ? rawMessage
      : res.status >= 500
        ? "Something went wrong on our side. Please try again."
        : "Request failed. Please try again.";
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export { API_BASE, TOKEN_KEY };
