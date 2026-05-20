"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePageActivation } from "@/hooks/use-page-activation";

export function NavRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the very first mount — data is already fresh from SSR
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    router.refresh();
  }, [pathname, router]); // fires on every route change, including router.push()

  usePageActivation(() => {
    if (document.visibilityState !== "visible") return;
    router.refresh();
  });

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const isHistoryRestore =
        event.persisted || navigationEntry?.type === "back_forward";

      if (isHistoryRestore) {
        window.location.reload();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return null;
}
