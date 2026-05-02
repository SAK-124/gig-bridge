type Props = { className?: string };

export const PaymentShield = ({ className = "" }: Props) => (
  <svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="psBg" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="hsl(var(--primary-soft))" />
        <stop offset="100%" stopColor="hsl(var(--background))" />
      </linearGradient>
    </defs>
    <rect width="320" height="240" rx="20" fill="url(#psBg)" />
    <path d="M 160 40 L 230 70 L 230 130 C 230 170 200 195 160 210 C 120 195 90 170 90 130 L 90 70 Z" fill="hsl(var(--primary))" />
    <path d="M 160 56 L 216 80 L 216 130 C 216 162 192 184 160 196 C 128 184 104 162 104 130 L 104 80 Z" fill="hsl(var(--card))" />
    <text x="160" y="118" textAnchor="middle" fontSize="38" fontFamily="serif" fontWeight="700" fill="hsl(var(--secondary))">Rs</text>
    <path d="M 130 152 L 154 174 L 196 122" stroke="hsl(var(--success))" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="60" cy="60" r="8" fill="hsl(var(--accent) / 0.7)" />
    <circle cx="270" cy="190" r="10" fill="hsl(var(--accent) / 0.5)" />
  </svg>
);
