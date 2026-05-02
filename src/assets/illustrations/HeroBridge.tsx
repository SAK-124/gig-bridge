type Props = { className?: string };

export const HeroBridge = ({ className = "" }: Props) => (
  <svg viewBox="0 0 600 480" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="heroSky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="hsl(var(--primary-soft))" />
        <stop offset="100%" stopColor="hsl(var(--background))" />
      </linearGradient>
      <linearGradient id="heroDeck" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--secondary))" />
      </linearGradient>
      <linearGradient id="heroSun" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="hsl(var(--accent))" />
        <stop offset="100%" stopColor="hsl(var(--accent) / 0.4)" />
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="600" height="480" rx="32" fill="url(#heroSky)" />

    {/* sun */}
    <circle cx="470" cy="120" r="60" fill="url(#heroSun)" opacity="0.85" />
    <circle cx="470" cy="120" r="78" fill="none" stroke="hsl(var(--accent) / 0.3)" strokeWidth="2" strokeDasharray="3 6" />

    {/* river */}
    <path d="M 0 360 Q 150 340 300 360 T 600 360 L 600 480 L 0 480 Z" fill="hsl(var(--primary) / 0.18)" />
    <path d="M 0 380 Q 200 365 400 380 T 600 380" fill="none" stroke="hsl(var(--primary) / 0.35)" strokeWidth="2" strokeLinecap="round" />

    {/* bridge cables */}
    <path d="M 60 320 C 200 80, 400 80, 540 320" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" strokeLinecap="round" />
    <path d="M 60 320 C 200 140, 400 140, 540 320" fill="none" stroke="hsl(var(--secondary) / 0.6)" strokeWidth="3" strokeLinecap="round" />

    {/* deck */}
    <rect x="40" y="318" width="520" height="14" rx="6" fill="url(#heroDeck)" />

    {/* towers */}
    <rect x="100" y="180" width="22" height="160" rx="4" fill="hsl(var(--secondary))" />
    <rect x="478" y="180" width="22" height="160" rx="4" fill="hsl(var(--secondary))" />
    <rect x="100" y="195" width="22" height="6" fill="hsl(var(--accent))" />
    <rect x="478" y="195" width="22" height="6" fill="hsl(var(--accent))" />

    {/* hangers */}
    {[140, 200, 260, 320, 380, 440].map((x) => (
      <line key={x} x1={x} y1="318" x2={x} y2={155 + Math.abs(300 - x) / 4} stroke="hsl(var(--secondary) / 0.45)" strokeWidth="1.5" />
    ))}

    {/* pakistan flag accent */}
    <rect x="295" y="296" width="18" height="22" fill="hsl(152 55% 38%)" rx="2" />
    <circle cx="307" cy="307" r="4.5" fill="hsl(var(--card))" />
    <circle cx="305" cy="306" r="4.5" fill="hsl(152 55% 38%)" />

    {/* student silhouettes walking */}
    <g transform="translate(180,290)">
      <circle r="6" fill="hsl(var(--accent))" />
      <rect x="-4" y="6" width="8" height="14" rx="2" fill="hsl(var(--accent))" />
    </g>
    <g transform="translate(420,290)">
      <circle r="6" fill="hsl(var(--primary))" />
      <rect x="-4" y="6" width="8" height="14" rx="2" fill="hsl(var(--primary))" />
    </g>

    {/* ground tags */}
    <g transform="translate(70,360)">
      <rect width="120" height="40" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
      <text x="14" y="18" fontSize="11" fill="hsl(var(--muted-foreground))" fontFamily="sans-serif" fontWeight="600">STUDENT</text>
      <text x="14" y="32" fontSize="13" fill="hsl(var(--secondary))" fontFamily="sans-serif" fontWeight="700">Apply &amp; deliver</text>
    </g>
    <g transform="translate(410,360)">
      <rect width="130" height="40" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
      <text x="14" y="18" fontSize="11" fill="hsl(var(--muted-foreground))" fontFamily="sans-serif" fontWeight="600">BUSINESS</text>
      <text x="14" y="32" fontSize="13" fill="hsl(var(--secondary))" fontFamily="sans-serif" fontWeight="700">Hire &amp; release</text>
    </g>
  </svg>
);
