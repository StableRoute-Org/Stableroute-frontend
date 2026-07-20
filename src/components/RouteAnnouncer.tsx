"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/lib/routes";

export function RouteAnnouncer() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState("");
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const route = Object.values(ROUTES).find((r) => r.href === pathname);
    if (route) {
      setAnnouncement(`${route.title} loaded.`);

      // Move focus to main content
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.focus();
      }
    }
  }, [pathname]);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );
}
