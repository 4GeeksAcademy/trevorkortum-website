"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, toUserMessage } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const data = await api<{ access_token?: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const token = data?.access_token;
      if (!token) {
        setError("Sign-in failed. Please try again.");
        return;
      }
      setToken(token);
      router.replace("/");
    } catch (err) {
      setError(
        toUserMessage(err, "Sign-in failed. Check your email and password, then try again.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <h1>Log in</h1>
      <p className="muted">Brasaland Digital access</p>
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={8} />
        </label>
        {error ? (
          <p className="error">
            {error}{" "}
            <button type="submit" disabled={loading}>
              Retry
            </button>
          </p>
        ) : null}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="muted">
        <Link href="/register">Create account</Link> ·{" "}
        <Link href="/forgot-password">Forgot password</Link>
      </p>
    </main>
  );
}
