type Props = { className?: string };

export const EmptyGigs = ({ className = "" }: Props) => (
  <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="50" y="40" width="220" height="140" rx="18" fill="hsl(var(--primary-soft))" />
    <rect x="70" y="62" width="180" height="14" rx="4" fill="hsl(var(--card))" opacity="0.85" />
    <rect x="70" y="86" width="120" height="10" rx="3" fill="hsl(var(--card))" opacity="0.7" />
    <rect x="70" y="110" width="80" height="22" rx="6" fill="hsl(var(--accent) / 0.55)" />
    <rect x="160" y="110" width="60" height="22" rx="6" fill="hsl(var(--primary))" />
    <circle cx="240" cy="50" r="14" fill="hsl(var(--accent))" />
    <text x="240" y="55" textAnchor="middle" fontSize="16" fontFamily="sans-serif" fontWeight="700" fill="hsl(var(--accent-foreground))">!</text>
    <path d="M 90 196 Q 160 180 230 196" fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
  </svg>
);
