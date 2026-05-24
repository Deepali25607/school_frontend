export function Skeleton({ className = "", ...rest }) {
  return (
    <div
      {...rest}
      className={`relative overflow-hidden rounded-xl bg-white/[0.04] ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card flex flex-col items-start gap-3">
      <div className="text-sm font-semibold text-rose-300">
        Couldn't load data
      </div>
      <div className="text-xs text-white/55">
        {error?.message || "Unknown error"}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost px-3 py-1.5 text-xs">
          Retry
        </button>
      )}
    </div>
  );
}
