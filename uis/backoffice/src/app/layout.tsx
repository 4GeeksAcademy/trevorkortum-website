import type { Metadata } from "next";
import "./globals.css";
import AuthShell from "@/components/AuthShell";

export const metadata: Metadata = {
  title: "Brasaland Backoffice",
  description:
    "Ingredient inventory for Brasaland Digital — deliveries, exits, and current_stock.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  );
}
