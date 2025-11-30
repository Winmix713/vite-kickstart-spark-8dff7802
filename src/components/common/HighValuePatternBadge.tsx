import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
export interface HighValuePattern {
  id?: string;
  pattern_key: string;
  label: string;
  frequency_pct: number;
  accuracy_pct: number;
  sample_size: number;
  highlight_text?: string;
  supporting_matches?: Array<{
    match_id?: number;
    date: string;
    teams: string;
  }>;
  discovered_at?: string;
  expires_at?: string;
}
interface HighValuePatternBadgeProps {
  pattern: HighValuePattern;
  showTooltip?: boolean;
}
export function HighValuePatternBadge({
  pattern,
  showTooltip = true
}: HighValuePatternBadgeProps) {
  return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 cursor-help">
            <Sparkles className="w-3 h-3 mr-1.5" />
            HIGH VALUE PATTERN
          </Badge>
        </TooltipTrigger>
        {showTooltip && <TooltipContent className="w-80 p-4">
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm text-white">
                  {pattern.label}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="text-left">
                  <p className="text-gray-300">Frequency</p>
                  <p className="font-bold text-amber-300">
                    {pattern.frequency_pct}%
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-gray-300">Accuracy</p>
                  <p className="font-bold text-green-300">
                    {pattern.accuracy_pct}%
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-gray-300">Samples</p>
                  <p className="font-bold text-blue-300">
                    {pattern.sample_size}
                  </p>
                </div>
              </div>

              {pattern.highlight_text && <div className="border-t border-gray-600 pt-2">
                  <p className="text-xs italic text-gray-200">
                    {pattern.highlight_text}
                  </p>
                </div>}

              {pattern.supporting_matches && pattern.supporting_matches.length > 0 && <div className="border-t border-gray-600 pt-2">
                    <p className="text-xs font-semibold text-gray-300 mb-1.5">
                      Supporting Matches:
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {pattern.supporting_matches.slice(0, 3).map((match, i) => <div key={i} className="text-xs text-gray-300 line-clamp-1">
                          • {match.teams} ({match.date})
                        </div>)}
                      {pattern.supporting_matches.length > 3 && <div className="text-xs text-gray-400 italic">
                          +{pattern.supporting_matches.length - 3} more
                        </div>}
                    </div>
                  </div>}

              {pattern.discovered_at && <div className="border-t border-gray-600 pt-2 text-xs text-gray-400">
                  <p>
                    Discovered:{" "}
                    {new Date(pattern.discovered_at).toLocaleDateString()}
                  </p>
                  {pattern.expires_at && <p>
                      Expires:{" "}
                      {new Date(pattern.expires_at).toLocaleDateString()}
                    </p>}
                </div>}
            </div>
          </TooltipContent>}
      </Tooltip>
    </TooltipProvider>;
}
export default HighValuePatternBadge;