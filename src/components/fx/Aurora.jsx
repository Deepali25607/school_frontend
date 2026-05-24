export default function Aurora({ className = "" }) {
  return (
    <>
      <div className={`aurora ${className}`} />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
    </>
  );
}
