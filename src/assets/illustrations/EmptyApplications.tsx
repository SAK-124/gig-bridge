type Props = { className?: string };

export const EmptyApplications = ({ className = "" }: Props) => (
  <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="60" y="50" width="200" height="140" rx="14" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
    <rect x="80" y="74" width="160" height="10" rx="3" fill="hsl(var(--primary) / 0.45)" />
    <rect x="80" y="94" width="120" height="8" rx="3" fill="hsl(var(--muted-foreground) / 0.4)" />
    <rect x="80" y="112" width="140" height="8" rx="3" fill="hsl(var(--muted-foreground) / 0.4)" />
    <rect x="80" y="148" width="70" height="22" rx="6" fill="hsl(var(--primary))" />
    <circle cx="246" cy="60" r="22" fill="hsl(var(--accent) / 0.85)" />
    <path d="M 236 60 l 6 6 l 12 -12" stroke="hsl(var(--accent-foreground))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
