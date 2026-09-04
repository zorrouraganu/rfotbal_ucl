export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark" aria-label="UCL Predictions">
      <svg viewBox="0 0 56 56" aria-hidden="true" className="brand-orbit">
        <defs>
          <linearGradient id="brand-glass" x1="8" y1="5" x2="48" y2="51" gradientUnits="userSpaceOnUse">
            <stop stopColor="#78E4FF" />
            <stop offset=".5" stopColor="#527DFF" />
            <stop offset="1" stopColor="#9D72FF" />
          </linearGradient>
          <linearGradient id="brand-sheen" x1="12" y1="7" x2="40" y2="47" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity=".3" />
            <stop offset=".48" stopColor="white" stopOpacity=".04" />
            <stop offset="1" stopColor="white" stopOpacity=".12" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="48" height="48" rx="13" fill="#0B1020" />
        <rect x="4.75" y="4.75" width="46.5" height="46.5" rx="12.25" fill="url(#brand-glass)" fillOpacity=".28" stroke="url(#brand-sheen)" strokeWidth="1.5" />
        <path d="M17.5 18.5v10.75C17.5 36.45 21.35 40 28 40s10.5-3.55 10.5-10.75V18.5" fill="none" stroke="url(#brand-glass)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="38.5" cy="18.5" r="2.6" fill="#C7F8FF" />
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
