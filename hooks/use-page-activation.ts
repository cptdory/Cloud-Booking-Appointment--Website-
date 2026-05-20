"use client";

import { useEffect, useEffectEvent, useRef } from "react";

type UsePageActivationOptions = {
  enabled?: boolean;
  minIntervalMs?: number;
};

export function usePageActivation(
  onActivate: () => void,
  options: UsePageActivationOptions = {}
) {
  const { enabled = true, minIntervalMs = 250 } = options;
  const lastRunRef = useRef(0);

  const runActivation = useEffectEvent(() => {
    if (!enabled) return;

    const now = Date.now();
    if (now - lastRunRef.current < minIntervalMs) return;

    lastRunRef.current = now;
    onActivate();
  });

  useEffect(() => {
    if (!enabled) return;

    const handlePageShow = () => runActivation();
    const handlePopState = () => runActivation();
    const handleFocus = () => runActivation();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runActivation();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, minIntervalMs]);
}
