// Tiny WebSocket client.
//  - connect(token): opens /api/realtime?token=…
//  - auto-reconnect with exponential-ish backoff
//  - subscribe(handler): every parsed message goes to handler
//  - onStatus(handler): receives { connected, since } whenever the link
//    flips between connected/disconnected
//
// No dependencies. Pure browser WebSocket API.

const eventListeners = new Set();
const statusListeners = new Set();

let socket = null;
let token = null;
let reconnectTimer = null;
let reconnectDelay = 1000; // grows up to 15s
let connected = false;
let since = null;

function emitStatus() {
  for (const fn of statusListeners) {
    try { fn({ connected, since }); } catch {}
  }
}

function buildUrl(t) {
  const base = import.meta.env.VITE_API_URL || window.location.origin;
  // http(s) → ws(s) — same origin/path through nginx in Docker
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}/api/realtime?token=${encodeURIComponent(t)}`;
}

export function connect(t) {
  // No-op if already connected with the same token
  if (socket && token === t && socket.readyState <= 1) return;
  disconnect();
  token = t;
  if (!t) return;
  open();
}

function open() {
  if (!token) return;
  try {
    socket = new WebSocket(buildUrl(token));
  } catch (e) {
    scheduleReconnect();
    return;
  }
  socket.onopen = () => {
    connected = true;
    since = Date.now();
    reconnectDelay = 1000;
    emitStatus();
  };
  socket.onclose = () => {
    connected = false;
    since = null;
    emitStatus();
    scheduleReconnect();
  };
  socket.onerror = () => {
    // close handler will run next and trigger reconnect
    try { socket && socket.close(); } catch {}
  };
  socket.onmessage = (e) => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }
    for (const fn of eventListeners) {
      try { fn(msg); } catch {}
    }
  };
}

function scheduleReconnect() {
  if (!token) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(open, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 1.6, 15000);
}

export function disconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  token = null;
  if (socket) {
    try { socket.close(); } catch {}
    socket = null;
  }
  connected = false;
  since = null;
  emitStatus();
}

export function subscribe(handler) {
  eventListeners.add(handler);
  return () => eventListeners.delete(handler);
}

export function onStatus(handler) {
  statusListeners.add(handler);
  // immediately push current state
  try { handler({ connected, since }); } catch {}
  return () => statusListeners.delete(handler);
}

export function status() {
  return { connected, since };
}
