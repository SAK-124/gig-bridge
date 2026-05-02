import { Link } from "react-router-dom";

type Props = { className?: string; mark?: boolean };

export const Logo = ({ className = "", mark = false }: Props) => {
  const inner = (
    <>
      <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary/10 ring-1 ring-primary/20">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
          <path d="M2 22 C 10 8, 22 8, 30 22" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M2 22 L 30 22" stroke="hsl(var(--secondary))" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="8" y1="22" x2="8" y2="14" stroke="hsl(var(--secondary))" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="22" x2="16" y2="10" stroke="hsl(var(--secondary))" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="24" y1="22" x2="24" y2="14" stroke="hsl(var(--secondary))" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="10" r="2" fill="hsl(var(--accent))" />
        </svg>
      </span>
      {!mark && <span className="font-display text-xl font-bold text-secondary leading-none">Gig Bridge</span>}
    </>
  );
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="Gig Bridge home">
      {inner}
    </Link>
  );
};
