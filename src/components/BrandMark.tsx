export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark" aria-label="UCL Predictions">
      <svg viewBox="0 0 56 56" aria-hidden="true" className="brand-orbit">
        <defs>
          <linearGradient id="brand-glass" x1="10" y1="7" x2="47" y2="49" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D8FAFF" />
            <stop offset=".38" stopColor="#72B5FF" />
            <stop offset="1" stopColor="#9878FF" />
          </linearGradient>
          <linearGradient id="brand-tile" x1="8" y1="5" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#172A52" />
            <stop offset=".52" stopColor="#091329" />
            <stop offset="1" stopColor="#17102D" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="50" height="50" rx="14" fill="url(#brand-tile)" />
        <rect x="3.75" y="3.75" width="48.5" height="48.5" rx="13.25" fill="none" stroke="white" strokeOpacity=".18" strokeWidth="1.5" />
        <path d="M28 10.2 31.5 21l9.3-6.1-6 9.5L45.6 28l-10.8 3.6 6 9.5-9.3-6.1L28 45.8 24.5 35l-9.3 6.1 6-9.5L10.4 28l10.8-3.6-6-9.5 9.3 6.1L28 10.2Z" fill="url(#brand-glass)" stroke="white" strokeOpacity=".48" strokeWidth=".9" strokeLinejoin="round" />
        <path d="m28 21 6.8 3.4v7.2L28 35l-6.8-3.4v-7.2L28 21Z" fill="#071127" fillOpacity=".88" stroke="#DDF8FF" strokeOpacity=".62" strokeWidth="1" />
        <circle cx="28" cy="28" r="2.1" fill="#E8FBFF" />
      </svg>
      {!compact && (
        <span>
          <strong>UCL Predictions</strong>
        </span>
      )}
    </div>
  );
}
