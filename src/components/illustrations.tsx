/** Small warm illustrations for empty states. Decorative, no text inside. */
export function EmptyIllustration({ kind = "posts", className = "mx-auto h-20 w-28" }: { kind?: "posts" | "people" | "jobs" | "messages"; className?: string }) {
  return (
    <svg viewBox="0 0 140 100" className={className} aria-hidden="true">
      <ellipse cx="70" cy="88" rx="52" ry="6" fill="#fef3c7" />
      {kind === "posts" && (
        <>
          <rect x="30" y="18" width="80" height="58" rx="10" fill="#fff" stroke="#fde68a" strokeWidth="3" />
          <rect x="42" y="32" width="40" height="6" rx="3" fill="#fcd34d" />
          <rect x="42" y="46" width="56" height="5" rx="2.5" fill="#e7e5e4" />
          <rect x="42" y="58" width="44" height="5" rx="2.5" fill="#e7e5e4" />
          <circle cx="98" cy="22" r="11" fill="#f59e0b" />
          <path d="M94 22h8M98 18v8" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {kind === "people" && (
        <>
          <circle cx="52" cy="38" r="14" fill="#fcd34d" />
          <path d="M28 80c0-14 11-24 24-24s24 10 24 24" fill="#fde68a" />
          <circle cx="92" cy="42" r="12" fill="#e7e5e4" />
          <path d="M72 80c0-12 9-21 20-21s20 9 20 21" fill="#f5f5f4" />
        </>
      )}
      {kind === "jobs" && (
        <>
          <rect x="34" y="34" width="72" height="46" rx="8" fill="#fff" stroke="#fde68a" strokeWidth="3" />
          <rect x="56" y="24" width="28" height="14" rx="4" fill="#f59e0b" />
          <rect x="34" y="50" width="72" height="4" fill="#fde68a" />
          <circle cx="70" cy="52" r="6" fill="#1c1917" />
        </>
      )}
      {kind === "messages" && (
        <>
          <rect x="28" y="22" width="60" height="36" rx="12" fill="#fde68a" />
          <path d="M40 58l-6 12 16-12z" fill="#fde68a" />
          <rect x="60" y="44" width="54" height="32" rx="12" fill="#fff" stroke="#fcd34d" strokeWidth="3" />
          <path d="M102 76l6 10-16-10z" fill="#fff" stroke="#fcd34d" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}
