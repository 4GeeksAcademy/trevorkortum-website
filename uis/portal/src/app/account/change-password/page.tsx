"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api, toUserMessage } from "@/lib/api";

export default function ChangePasswordPage() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const currentPassword = String(form.get("current_password") || "");
    const newPassword = String(form.get("new_password") || "");
    const confirm = String(form.get("confirm") || "");
    if (newPassword !== confirm) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ detail?: string }>(
        "/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        },
        true
      );
      setMessage(data?.detail || "Password changed.");
      formEl?.reset();
    } catch (err) {
      setError(toUserMessage(err, "Could not change your password. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <h1>Change password</h1>
      <nav className="nav">
        <Link href="/">Home</Link>
        <Link href="/account/profile">Profile</Link>
      </nav>
      <form onSubmit={onSubmit}>
        <label>
          Current password
          <input name="current_password" type="password" required />
        </label>
        <label>
          New password
          <input name="new_password" type="password" required minLength={8} />
        </label>
        <label>
          Confirm new password
          <input name="confirm" type="password" required minLength={8} />
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
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
