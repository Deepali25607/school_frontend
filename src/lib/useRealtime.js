import { useEffect, useRef, useState } from "react";
import { subscribe, onStatus, status } from "./realtime.js";

/**
 * Subscribe to realtime events.
 *
 * @param {string|string[]|null} match  Event type(s) to react to. Null = every event.
 * @param {(msg: object) => void} handler  Called for each matching message.
 *
 * Handler runs on the latest closure (no stale state captures).
 */
export function useRealtime(match, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const matchesType = (type) => {
      if (!match) return true;
      if (Array.isArray(match)) return match.includes(type);
      return type === match;
    };
    return subscribe((msg) => {
      if (matchesType(msg.type)) handlerRef.current(msg);
    });
  }, [Array.isArray(match) ? match.join("|") : match]);
}

/** Connection state for the realtime socket. */
export function useRealtimeStatus() {
  const [s, setS] = useState(status());
  useEffect(() => onStatus(setS), []);
  return s;
}
