"use client";

import Link from "next/link";
import { clearToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  return (
    <main className="shell wide">
      <h1>Brasaland portal</h1>
      <p className="muted">Signed-in workspace for procurement and account settings.</p>
      <nav className="nav">
        <Link href="/account/profile">Profile</Link>
        <Link href="/account/change-password">Change password</Link>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            clearToken();
            router.replace("/login");
          }}
        >
          Log out
        </a>
      </nav>
    </main>
  );
}
