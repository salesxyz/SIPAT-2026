import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function Logo({ light = false, to = "/" }: { light?: boolean; to?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label="SIPAT – página inicial">
      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${light ? "bg-white text-sipat" : "bg-sipat text-white"} shadow-card`}>
        <ShieldCheck size={24} strokeWidth={2.4} />
      </span>
      <span className={`font-display text-2xl font-extrabold leading-none tracking-tight ${light ? "text-white" : "text-sipat-dark"}`}>
        SIPAT
        <span className={`block text-[10px] font-semibold tracking-normal ${light ? "text-white/70" : "text-sipat/80"}`}>Photo Drive</span>
      </span>
    </Link>
  );
}
