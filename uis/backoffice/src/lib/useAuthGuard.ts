"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "./api";

const PUBLIC = new Set(["/login"]);

/**
 * Protect all backoffice routes: unauthenticated users go to `/login`.
 * Authenticated users hitting `/login` are sent to the ingredients list.
 */
export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const isPublic = PUBLIC.has(pathname || "");
    if (!token && !isPublic) {
      router.replace("/login");
      return;
    }
    if (token && pathname === "/login") {
      router.replace("/backoffice/inventory/products");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  return ready;
}
