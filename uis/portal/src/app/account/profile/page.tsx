"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, toUserMessage } from "@/lib/api";

type Profile = { name?: string | null; phone?: string | null; address?: string | null };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  async function loadProfile() {
    setInitialLoading(true);
    setLoadFailed(false);
    setError("");
    try {
      const data = await api<Profile>("/profiles/me", {}, true);
      setProfile(data || { name: "", phone: "", address: "" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // First visit — empty form is expected.
        setProfile({ name: "", phone: "", address: "" });
      } else {
        setLoadFailed(true);
        setError(toUserMessage(err, "Could not load your profile. Please try again."));
      }
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loadFailed) return;
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(e.currentTarget);
    try {
      const updated = await api<Profile>(
        "/profiles/me",
        {
          method: "PUT",
          body: JSON.stringify({
            name: form.get("name") || null,
            phone: form.get("phone") || null,
            address: form.get("address") || null,
          }),
        },
        true
      );
      setProfile(updated || { name: "", phone: "", address: "" });
      setMessage("Profile saved.");
    } catch (err) {
      setError(toUserMessage(err, "Could not save your profile. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <h1>Profile</h1>
      <nav className="nav">
        <Link href="/">Home</Link>
        <Link href="/account/change-password">Change password</Link>
      </nav>
      {initialLoading ? <p className="muted">Loading profile…</p> : null}
      {loadFailed ? (
        <div>
          {error ? <p className="error">{error}</p> : null}
          <button type="button" onClick={() => void loadProfile()}>
            Retry
          </button>
        </div>
      ) : null}
      {!initialLoading && !loadFailed ? (
        <form onSubmit={onSubmit}>
          <label>
            Name
            <input name="name" defaultValue={profile.name || ""} key={`n-${profile.name}`} />
          </label>
          <label>
            Phone
            <input name="phone" defaultValue={profile.phone || ""} key={`p-${profile.phone}`} />
          </label>
          <label>
            Address
            <input
              name="address"
              defaultValue={profile.address || ""}
              key={`a-${profile.address}`}
            />
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
            {loading ? "Saving…" : "Save profile"}
          </button>
        </form>
      ) : null}
    </main>
  );
}
