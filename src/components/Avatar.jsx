// Reusable avatar that shows a real photo when present, falling back to the
// 2-letter initials chip the rest of the app already uses.
//
// Sizes are explicit px so square images scale crisply. The wrapper passes
// className through so callers can layer extra rings, glow, etc.
export default function Avatar({
  photoUrl,
  initials,
  size = 40,
  className = "",
  ringClass = "",
  fallbackClass = "from-brand-500 to-accent-pink",
  alt,
}) {
  const px = `${size}px`;
  const fontSize = Math.max(10, Math.round(size * 0.34)) + "px";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={alt || initials || "avatar"}
        className={`shrink-0 rounded-2xl object-cover ${ringClass} ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${fallbackClass} font-display font-bold text-white ${ringClass} ${className}`}
      style={{ width: px, height: px, fontSize }}
      aria-label={alt || initials}
    >
      {initials || "?"}
    </div>
  );
}
