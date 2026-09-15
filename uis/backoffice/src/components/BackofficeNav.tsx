"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";

const NAV = [
  { href: "/backoffice/inventory/products", label: "Ingredients" },
  { href: "/backoffice/inventory/orders/inbound", label: "Inbound delivery" },
  { href: "/backoffice/inventory/orders/outbound", label: "Outbound exit" },
  { href: "/backoffice/inventory/orders", label: "Order history" },
] as const;

export default function BackofficeNav() {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    clearToken();
    router.replace("/login");
  }

  return (
    <header className="bo-topbar">
      <div className="bo-brand">
        <strong>Brasaland</strong>
        <span>Backoffice · Inventory</span>
      </div>
      <nav className="nav" aria-label="Inventory navigation">
        {NAV.map((item) => {
          const active =
            item.href === "/backoffice/inventory/orders"
              ? pathname === item.href
              : pathname === item.href ||
                Boolean(pathname?.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "active" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
        <button type="button" className="linkish" onClick={signOut}>
          Sign out
        </button>
      </nav>
    </header>
  );
}
