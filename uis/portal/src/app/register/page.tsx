"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, toUserMessage } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdNeedsLogin, setCreatedNeedsLogin] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCreatedNeedsLogin(false);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const address = String(form.get("address") || "").trim();

    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          profile:
            name || phone || address
              ? { name: name || null, phone: phone || null, address: address || null }
              : null,
        }),
      });

      const data = await api<{ access_token?: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const token = data?.access_token;
      if (!token) {
        setCreatedNeedsLogin(true);
        setError(
          "Account created, but sign-in failed. Please go to login and sign in with your new credentials."
        );
        return;
      }
      setToken(token);
      router.replace("/");
    } catch (err) {
      setError(toUserMessage(err, "Could not create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={8} />
        </label>
        <label>
          Name (optional)
          <input name="name" />
        </label>
        <label>
          Phone (optional)
          <input name="phone" />
        </label>
        <label>
          Address (optional)
          <input name="address" />
        </label>
        {error ? (
          <p className="error">
            {error}{" "}
            {createdNeedsLogin ? (
              <Link href="/login">Sign in now</Link>
            ) : (
              <button type="submit" disabled={loading}>
                Retry
              </button>
            )}
          </p>
        ) : null}
        <button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="muted">
        <Link href="/login">Back to login</Link>
      </p>
    </main>
  );
}
