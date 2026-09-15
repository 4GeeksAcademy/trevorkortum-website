"use client";

import { Suspense } from "react";
import OutboundExitForm from "./OutboundExitForm";

export default function OutboundExitPage() {
  return (
    <Suspense fallback={<main className="panel"><p className="muted">Loading…</p></main>}>
      <OutboundExitForm />
    </Suspense>
  );
}
