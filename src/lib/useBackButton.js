import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";

/**
 * Registers a handler for the Android hardware back button.
 *
 * Without this, the native back button bubbles up to the OS and closes the
 * whole app on every press — even when the user only wanted to go back one
 * screen. The handler runs on every press and decides what "back" means
 * (close an open overlay, navigate up, or exit at the root).
 *
 * No-op on web / iOS (no hardware back button), so it's safe to mount
 * unconditionally.
 *
 * The latest handler is kept in a ref so we register the native listener
 * once and never miss state updates (overlay open/closed, current route).
 */
export function useBackButton(handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove = () => {};
    let cancelled = false;

    // addListener is async on Capacitor 8 — it resolves to a handle.
    CapacitorApp.addListener("backButton", (event) => {
      handlerRef.current?.(event);
    }).then((handle) => {
      if (cancelled) handle.remove();
      else remove = () => handle.remove();
    });

    return () => {
      cancelled = true;
      remove();
    };
  }, []);
}

/** Exit the native app (Android). No-op elsewhere. */
export function exitApp() {
  if (Capacitor.isNativePlatform()) CapacitorApp.exitApp();
}
