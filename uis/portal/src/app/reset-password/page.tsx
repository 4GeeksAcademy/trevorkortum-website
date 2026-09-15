"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, toUserMessage } from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Missing reset token");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      router.replace("/login");
    } catch (err) {
      setError(
        toUserMessage(
          err,
          "Could not reset your password. Request a new reset link and try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <h1>Reset password</h1>
      <form onSubmit={onSubmit}>
        <label>
          New password
          <input name="password" type="password" required minLength={8} />
        </label>
        <label>
          Confirm password
          <input name="confirm" type="password" required minLength={8} />
        </label>
        {error ? (
          <p className="error">
            {error}{" "}
            <button type="submit" disabled={loading}>
              Retry
            </button>
            {" · "}
            <Link href="/forgot-password">Request a new reset link</Link>
          </p>
        ) : null}
        <button type="submit" disabled={loading}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="muted">
        <Link href="/login">Back to login</Link>
      </p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <ResetForm />
    </Suspense>
  );
}
