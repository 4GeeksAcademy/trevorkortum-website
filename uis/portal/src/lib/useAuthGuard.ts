"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "./api";

const PUBLIC = new Set(["/login", "/register", "/forgot-password", "/reset-password"]);

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
    if (token && (pathname === "/login" || pathname === "/register")) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  return ready;
}
