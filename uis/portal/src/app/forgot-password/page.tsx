"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ApiError, api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const data = await api<{ detail: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email") }),
      });
      setMessage(data.detail || "If that email exists, a reset link has been sent.");
    } catch (err) {
      // Keep anti-enumeration for API client errors; surface transport failures.
      if (err instanceof ApiError && err.status === 0) {
        setError("Unable to reach the server. Check your connection and try again.");
      } else if (err instanceof ApiError && err.status >= 500) {
        setError("Something went wrong on our side. Please try again shortly.");
      } else if (err instanceof TypeError) {
        setError("Unable to reach the server. Check your connection and try again.");
      } else {
        setMessage("If that email exists, a reset link has been sent.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <h1>Forgot password</h1>
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input name="email" type="email" required disabled={loading} />
        </label>
        {error ? (
          <p className="error">
            {error}{" "}
            <button type="submit" disabled={loading}>
              Retry
            </button>
          </p>
        ) : null}
        {message ? <p className="success">{message}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="muted">
        <Link href="/login">Back to login</Link>
        {" · "}
        Need help? Contact Brasaland Digital support.
      </p>
    </main>
  );
}
