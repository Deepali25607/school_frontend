import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

// All notification type IDs the backend can produce. Kept in sync with
// `backend/data/notifications.js`'s TYPE_META.
export const NOTIFICATION_TYPES = [
  { id: "admissions.new", label: "New admissions" },
  { id: "admissions.enrolled", label: "Student enrolled" },
  { id: "admissions.rejected", label: "Application rejected" },
  { id: "maintenance.critical", label: "Critical maintenance" },
  { id: "maintenance.resolved", label: "Maintenance resolved" },
  { id: "visitors.checkin", label: "Visitor check-ins" },
  { id: "documents.requested", label: "Document requests" },
  { id: "documents.issued", label: "Documents issued" },
  { id: "leave.applied", label: "Leave applications" },
  { id: "leave.decided", label: "Leave decisions" },
  { id: "broadcasts.sent", label: "Announcements" },
  { id: "health.urgent", label: "Urgent sickbay visits" },
  { id: "inventory.lowstock", label: "Low stock alerts" },
  { id: "discipline.major", label: "Major incidents" },
  { id: "discipline.escalated", label: "Escalated incidents" },
  { id: "achievement.added", label: "Student achievements" },
  { id: "events.added", label: "New events" },
  { id: "fees.payment", label: "Fee payments" },
  { id: "fees.failed", label: "Payment failures" },
];

function key(userId) {
  return `lumina-muted-notifications:${userId || "anon"}`;
}

/** Per-user notification mute preferences, stored in localStorage. */
export function useNotificationPrefs() {
  const { user } = useAuth();
  const [muted, setMuted] = useState(() => new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key(user?.id));
      const arr = raw ? JSON.parse(raw) : [];
      setMuted(new Set(Array.isArray(arr) ? arr : []));
    } catch {
      setMuted(new Set());
    }
  }, [user?.id]);

  const save = (next) => {
    setMuted(next);
    try {
      localStorage.setItem(key(user?.id), JSON.stringify([...next]));
    } catch {}
  };

  const toggle = (type) => {
    const next = new Set(muted);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    save(next);
  };
  const muteAll = () => save(new Set(NOTIFICATION_TYPES.map((t) => t.id)));
  const unmuteAll = () => save(new Set());

  return {
    muted,
    isMuted: (type) => muted.has(type),
    toggle,
    muteAll,
    unmuteAll,
    types: NOTIFICATION_TYPES,
  };
}
