/** The Piron Work mark: a warm yellow "play" shape, as on the mockup. Inline SVG so it needs no asset file. */
export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pt-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#pt-mark)" />
      <path d="M15 11.5v17a1.5 1.5 0 0 0 2.3 1.27l13-8.5a1.5 1.5 0 0 0 0-2.54l-13-8.5A1.5 1.5 0 0 0 15 11.5z" fill="#fffbeb" />
    </svg>
  );
}

/** Angkor Wat silhouette for hero blocks. Decorative only. */
export function AngkorSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 90" className={className} aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <path
        fill="currentColor"
        d="M0 90V70h18l4-14 4 14h14l3-10 3 10h10l5-18 2-8 3 8 5 18h12l4-12 4 12h16l6-22 3-12 3 12 6 22h14l5-16 5 16h12l6-26 4-20 4 20 6 26h12l5-16 5 16h14l6-22 3-12 3 12 6 22h16l4-12 4 12h12l5-18 3-8 2 8 5 18h10l3-10 3 10h14l4-14 4 14h18v20z"
      />
    </svg>
  );
}
