import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2 ${className}`}>
    <img src={logo} alt="Gig Bridge" width={36} height={36} className="h-9 w-9" />
    <span className="font-display text-xl font-bold text-secondary">Gig Bridge</span>
  </Link>
);
