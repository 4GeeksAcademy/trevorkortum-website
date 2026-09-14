"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    try {
      const data = await api<{ detail: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email") }),
      });
      setMessage(data.detail || "If that email exists, a reset link has been sent.");
    } catch {
      setMessage("If that email exists, a reset link has been sent.");
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
        {message ? <p className="success">{message}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="muted">
        <Link href="/login">Back to login</Link>
      </p>
    </main>
  );
}
