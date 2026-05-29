import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { endpoints } from "./api.js";
import { subscribe } from "./realtime.js";
import { useNotificationPrefs } from "./useNotificationPrefs.js";
import { useAuth } from "../context/AuthContext.jsx";

// Visibility check mirroring the backend's audience model. Used to drop
// realtime `notification.appended` events that aren't for this user — the
// broker broadcasts every notification to every connected client.
function isVisibleTo(n, user) {
  if (!user || !n) return false;
  const role = user.role;
  if (["admin", "principal", "hr", "accountant"].includes(role)) return true;
  const aud = n.audience || "all";
  if (aud === "all") return true;
  if (aud === "staff") return ["teacher", "hr", "accountant"].includes(role);
  if (aud === "owners") {
    if (!n.studentId) return false;
    if (role === "student") return user.scope?.studentId === n.studentId;
    if (role === "parent")
      return (user.scope?.children || []).some((c) => c.id === n.studentId);
    if (role === "teacher")
      return (user.scope?.studentIds || []).includes(n.studentId);
    return false;
  }
  return false;
}

// Hook for the topbar bell + notifications panel.
// Holds: { items, unreadCount, loading, markRead, markAllRead, refresh }.
// Auto-prepends incoming `notification.appended` events from the realtime stream
// so the bell badge updates without a refetch.
export function useNotifications(limit = 30) {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const limitRef = useRef(limit);
  limitRef.current = limit;

  const fetchOnce = useCallback(async () => {
    try {
      const res = await endpoints.notifications({ limit: limitRef.current });
      setItems(res.items || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // network down — keep what we have
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnce();
  }, [fetchOnce]);

  // Live: prepend new notifications as they arrive — but only if they are
  // actually for this user. The broker broadcasts to every client without
  // filtering, so we mirror the backend's audience model here.
  useEffect(() => {
    return subscribe((msg) => {
      if (msg.type !== "notification.appended" || !msg.notification) return;
      if (!isVisibleTo(msg.notification, userRef.current)) return;
      setItems((prev) => {
        const merged = [{ ...msg.notification, read: false }, ...prev];
        return merged.slice(0, limitRef.current);
      });
      setUnreadCount((c) => c + 1);
    });
  }, []);

  const markRead = useCallback(async (id) => {
    // optimistic
    setItems((prev) =>
      prev.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await endpoints.notificationRead(id);
    } catch {
      // rollback isn't critical here — refetch will reconcile
      fetchOnce();
    }
  }, [fetchOnce]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await endpoints.notificationsMarkAllRead();
    } catch {
      fetchOnce();
    }
  }, [fetchOnce]);

  // Per-user mute prefs filter out types the user doesn't care about.
  // Filtered list drives the bell panel + unread badge so muted categories
  // disappear silently without losing read state on the server.
  const { muted } = useNotificationPrefs();
  const visibleItems = useMemo(
    () => items.filter((n) => !muted.has(n.type)),
    [items, muted]
  );
  const visibleUnreadCount = useMemo(
    () => visibleItems.filter((n) => !n.read).length,
    [visibleItems]
  );

  return {
    items: visibleItems,
    unreadCount: visibleUnreadCount,
    rawItems: items,
    rawUnreadCount: unreadCount,
    loading,
    markRead,
    markAllRead,
    refresh: fetchOnce,
  };
}
