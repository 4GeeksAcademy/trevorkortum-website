"use client";

import { useAuthGuard } from "@/lib/useAuthGuard";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const ready = useAuthGuard();
  if (!ready) return <p className="muted">Loading…</p>;
  return <>{children}</>;
}
