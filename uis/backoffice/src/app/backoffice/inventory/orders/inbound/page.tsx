"use client";

import { Suspense } from "react";
import InboundDeliveryForm from "./InboundDeliveryForm";

export default function InboundDeliveryPage() {
  return (
    <Suspense fallback={<main className="panel"><p className="muted">Loading…</p></main>}>
      <InboundDeliveryForm />
    </Suspense>
  );
}
