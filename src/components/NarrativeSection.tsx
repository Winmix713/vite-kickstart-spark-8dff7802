import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, Target } from "lucide-react";
import { cn } from "@/lib/utils";
interface NarrativeSectionProps {
  narrative: string; // Fő narratív szöveg (1-2 bekezdés)
  supportingFactors: string[]; // Támogató tényezők listája
  riskFactors: string[]; // Kockázati tényezők listája
  bettingSuggestions: {
    high: string; // Magas megbízhatóságú javaslat
    medium: string; // Közepes megbízhatóságú javaslat
    low: string; // Alacsony megbízhatóságú javaslat
  };
  cssScore: number; // 0-10, a fogadási javaslat színezéséhez
}
export function NarrativeSection({
  narrative,
  supportingFactors,
  riskFactors,
  bettingSuggestions,
  cssScore
}: NarrativeSectionProps) {
  // Fogadási javaslat színezés
  const getSuggestionColor = (type: "high" | "medium" | "low") => {
    if (type === "high" && cssScore >= 8.5) {
      return "bg-green-100 text-green-800 border-green-300";
    } else if (type === "medium" && cssScore >= 7) {
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    } else {
      return "bg-red-100 text-red-800 border-red-300";
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <span>📖</span>
          <span>Szakértői Elemzés</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Narratív szöveg */}
        <div className="prose prose-slate max-w-none">
          <p className="text-lg leading-relaxed text-foreground">{narrative}</p>
        </div>

        {/* Támogató és Kockázati tényezők - Responsive Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Támogató tényezők */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Támogató tényezők
            </h3>
            <ul className="space-y-2">
              {supportingFactors.map((factor, index) => <li key={index} className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm">
                  <span className="text-green-600">✅</span>
                  <span className="text-green-900">{factor}</span>
                </li>)}
            </ul>
          </div>

          {/* Kockázati tényezők */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Kockázati tényezők
            </h3>
            <ul className="space-y-2">
              {riskFactors.map((factor, index) => <li key={index} className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm">
                  <span className="text-amber-600">⚠️</span>
                  <span className="text-amber-900">{factor}</span>
                </li>)}
            </ul>
          </div>
        </div>

        {/* Fogadási javaslatok */}
        <Alert className="border-2 border-blue-200 bg-blue-50">
          <Target className="h-5 w-5 text-blue-600" />
          <AlertDescription>
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-900">Fogadási javaslatok</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={cn("border-2 px-3 py-1 text-sm font-semibold", getSuggestionColor("high"))}>
                  <span className="mr-1">🎯</span>
                  {bettingSuggestions.high}
                </Badge>
                <Badge variant="outline" className={cn("border-2 px-3 py-1 text-sm font-semibold", getSuggestionColor("medium"))}>
                  <span className="mr-1">⚡</span>
                  {bettingSuggestions.medium}
                </Badge>
                <Badge variant="outline" className={cn("border-2 px-3 py-1 text-sm font-semibold", getSuggestionColor("low"))}>
                  <span className="mr-1">🚫</span>
                  {bettingSuggestions.low}
                </Badge>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>;
}