import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PatternTypeKey, PatternBadgeProps } from "./PatternBadge.types";
function getVisuals(type: PatternTypeKey) {
  switch (type) {
    case "winning_streak":
      return {
        icon: "🔥",
        classes: "from-red-500/20 to-red-500/10 text-red-600 ring-red-500/30"
      };
    case "home_dominance":
      return {
        icon: "🏠",
        classes: "from-blue-500/20 to-blue-500/10 text-blue-600 ring-blue-500/30"
      };
    case "high_scoring_trend":
      return {
        icon: "⚽",
        classes: "from-green-500/20 to-green-500/10 text-green-600 ring-green-500/30"
      };
    case "defensive_solid":
      return {
        icon: "🛡️",
        classes: "from-zinc-500/20 to-zinc-500/10 text-zinc-600 ring-zinc-500/30"
      };
    case "form_surge":
    default:
      return {
        icon: "📈",
        classes: "from-orange-500/20 to-orange-500/10 text-orange-600 ring-orange-500/30"
      };
  }
}
function strengthFlames(strength: number) {
  if (strength >= 85) return "🔥🔥🔥";
  if (strength >= 65) return "🔥🔥";
  if (strength >= 40) return "🔥";
  return "";
}
export function PatternBadge({
  type,
  name,
  confidence,
  strength,
  metadata
}: PatternBadgeProps) {
  const visuals = getVisuals(type);
  const title = name ?? (type === "winning_streak" ? "Winning Streak" : type === "home_dominance" ? "Home Dominance" : type === "high_scoring_trend" ? "High Scoring" : type === "defensive_solid" ? "Defensive Solid" : "Form Surge");
  return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-br ${visuals.classes} ring-1 cursor-default`}> 
            <span className="text-base" aria-hidden>{visuals.icon}</span>
            <span className="text-sm font-semibold">{title}</span>
            <span className="text-xs text-foreground/70">{confidence}%</span>
            {strength >= 40 && <span className="text-base leading-none" title={`Strength ${strength}`}>{strengthFlames(strength)}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="text-sm font-semibold mb-1">{title}</div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Confidence: {confidence}%</div>
            <div>Strength: {strength}/100</div>
            {metadata && <pre className="mt-1 text-[10px] leading-tight whitespace-pre-wrap break-words">{JSON.stringify(metadata, null, 0)}</pre>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>;
}
export default PatternBadge;