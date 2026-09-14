"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Profile = { name?: string | null; phone?: string | null; address?: string | null };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Profile>("/profiles/me", {}, true)
      .then(setProfile)
      .catch(async () => {
        // create empty profile on first visit via PUT
        setProfile({ name: "", phone: "", address: "" });
      });
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      setProfile(updated);
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
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
          <input name="address" defaultValue={profile.address || ""} key={`a-${profile.address}`} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
