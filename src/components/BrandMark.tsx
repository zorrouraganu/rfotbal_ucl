export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark" aria-label="UCL Predictions">
      <svg viewBox="0 0 56 56" aria-hidden="true" className="brand-orbit">
        <defs>
          <linearGradient id="brand-glass" x1="9" y1="7" x2="47" y2="49" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A9F4FF" />
            <stop offset=".5" stopColor="#6B8CFF" />
            <stop offset="1" stopColor="#A76DFF" />
          </linearGradient>
        </defs>
        <circle cx="28" cy="28" r="22" fill="url(#brand-glass)" fillOpacity=".2" stroke="url(#brand-glass)" strokeWidth="1.5" />
        <path d="M17 18v11c0 7 4.1 11 11 11s11-4 11-11V18" fill="none" stroke="url(#brand-glass)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="39" cy="18" r="3" fill="#B8F7FF" />
      </svg>
      {!compact && (
        <span>
          <strong>UCL Predictions</strong>
          <small>Sezonul 2026–27</small>
        </span>
      )}
    </div>
  );
}
