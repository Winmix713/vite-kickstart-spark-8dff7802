import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
interface CSSBadgeProps {
  score: number; // 0-10 skálán
  dataQuality: number; // 0-10
  confidence: number; // 0-10
  context: number; // 0-10
  badge: "Magas" | "Közepes" | "Alacsony";
  trend?: "up" | "down" | "stable"; // Opcionális trend nyíl
}
export function CSSBadge({
  score,
  dataQuality,
  confidence,
  context,
  badge,
  trend
}: CSSBadgeProps) {
  // Dinamikus színezés logika
  const getColorClasses = () => {
    if (score >= 8.5) {
      return {
        gradient: "bg-gradient-to-r from-green-500 to-green-600",
        text: "text-white",
        border: "border-green-400"
      };
    } else if (score >= 7) {
      return {
        gradient: "bg-gradient-to-r from-yellow-500 to-yellow-600",
        text: "text-white",
        border: "border-yellow-400"
      };
    } else {
      return {
        gradient: "bg-gradient-to-r from-red-500 to-red-600",
        text: "text-white",
        border: "border-red-400"
      };
    }
  };
  const colors = getColorClasses();

  // Trend ikon
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  // Badge szöveg
  const badgeText = badge === "Magas" ? "Magas megbízhatóság" : badge === "Közepes" ? "Közepes megbízhatóság" : "Alacsony megbízhatóság";
  return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center gap-3 rounded-lg border-2 px-4 py-3 shadow-lg transition-all hover:shadow-xl cursor-pointer", colors.gradient, colors.border, trend === "up" && "animate-pulse")}>
            <div className="flex flex-col items-center">
              <span className={cn("text-3xl font-bold", colors.text)}>{score.toFixed(1)}</span>
              <span className={cn("text-xs font-medium opacity-90", colors.text)}>/ 10</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className={cn("text-sm font-semibold", colors.text)}>{badgeText}</span>
              {trend && <div className="flex items-center gap-1">
                  <TrendIcon className={cn("h-4 w-4", colors.text)} />
                  <span className={cn("text-xs", colors.text)}>
                    {trend === "up" ? "Javulás" : trend === "down" ? "Romlás" : "Stabil"}
                  </span>
                </div>}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 p-2">
            <p className="font-semibold text-sm">Részletes bontás:</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <span>Adatminőség:</span>
                <span className="font-semibold">{dataQuality.toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Confidence:</span>
                <span className="font-semibold">{confidence.toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Kontextus:</span>
                <span className="font-semibold">{context.toFixed(1)}/10</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>;
}