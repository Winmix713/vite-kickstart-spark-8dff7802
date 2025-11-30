import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  intent?: "positive" | "warning" | "neutral";
  icon?: ComponentType<{
    className?: string;
  }>;
}
const intentClasses: Record<NonNullable<MetricCardProps["intent"]>, string> = {
  positive: "text-emerald-300",
  warning: "text-amber-300",
  neutral: "text-slate-200"
};
const WinmixProMetricCard = ({
  label,
  value,
  hint,
  trend,
  intent = "neutral",
  icon: Icon
}: MetricCardProps) => <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10/20 via-white/5 to-transparent p-5 shadow-[0_15px_60px_rgba(0,0,0,0.35)] transition duration-300 hover:border-white/30 hover:bg-white/10">
    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
      <span>{label}</span>
      {Icon ? <Icon className="h-4 w-4 text-white/60" /> : null}
    </div>
    <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
      {value}
    </div>
    <div className="mt-2 flex items-center justify-between text-xs text-white/60">
      {hint ? <span>{hint}</span> : <span>&nbsp;</span>}
      {trend ? <span className={cn("font-semibold", intentClasses[intent])}>{trend}</span> : null}
    </div>
  </div>;
export default WinmixProMetricCard;