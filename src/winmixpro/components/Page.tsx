import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import WinmixProLoadingGrid from "@/winmixpro/components/LoadingGrid";
import { useShimmer } from "@/winmixpro/hooks/useShimmer";
interface WinmixProPageProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}
const WinmixProPage = ({
  title,
  description,
  eyebrow = "WinmixPro admin",
  actions,
  children,
  className
}: WinmixProPageProps) => {
  const ready = useShimmer();
  return <section className={cn("space-y-6", className)}>
      <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900/70 via-slate-900/30 to-slate-900/10 p-6 shadow-[0_20px_80px_rgba(8,15,35,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/80">{eyebrow}</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-white/70 lg:text-base">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>

      {ready ? <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div> : <WinmixProLoadingGrid />}
    </section>;
};
export default WinmixProPage;