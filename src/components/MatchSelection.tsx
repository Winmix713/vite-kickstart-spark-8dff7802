import { useState } from "react";
import { Calendar, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MatchCard from "./MatchCard";
import PredictionResults from "./PredictionResults";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LEAGUE_METADATA, LEAGUE_TEAM_OPTIONS, type LeagueKey, type TeamOption } from "@/data/teamOptions";
interface MatchSelectionState {
  home: TeamOption | null;
  away: TeamOption | null;
}
interface CompletedMatch {
  home: TeamOption;
  away: TeamOption;
}
interface NormalizedPattern {
  key: string;
  name: string;
  confidence_boost: number;
  data?: Record<string, unknown>;
}
interface RawPatternResponse {
  template_name?: string;
  confidence_boost?: number;
  data?: Record<string, unknown>;
}
interface NormalizedPrediction {
  match: {
    home: string;
    away: string;
  };
  matchId: string;
  prediction?: {
    predicted_outcome?: string;
    confidence_score?: number;
    actual_outcome?: string | null;
    was_correct?: boolean | null;
    [key: string]: unknown;
  };
  patterns: NormalizedPattern[];
  formScores?: {
    home: number;
    away: number;
  };
}
const MATCH_COUNT = 8;
const createInitialMatches = (): MatchSelectionState[] => Array.from({
  length: MATCH_COUNT
}, () => ({
  home: null,
  away: null
}));
const isCompletedMatch = (match: MatchSelectionState): match is CompletedMatch => match.home !== null && match.away !== null;
const formatPatternName = (templateName?: string) => {
  if (!templateName) {
    return "Ismeretlen minta";
  }
  return templateName.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};
const MatchSelection = () => {
  const [league, setLeague] = useState<LeagueKey>("angol");
  const [matches, setMatches] = useState<MatchSelectionState[]>(createInitialMatches);
  const [showPredictions, setShowPredictions] = useState(false);
  const [predictions, setPredictions] = useState<NormalizedPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const teams = LEAGUE_TEAM_OPTIONS[league];
  const handleLeagueChange = (newLeague: LeagueKey) => {
    setLeague(newLeague);
    setMatches(createInitialMatches());
    setShowPredictions(false);
    setPredictions([]);
  };
  const handleMatchChange = (index: number, teamValue: string, side: "home" | "away") => {
    const selectedTeam = LEAGUE_TEAM_OPTIONS[league].find(team => team.value === teamValue) ?? null;
    setMatches(prevMatches => prevMatches.map((match, idx) => idx === index ? {
      ...match,
      [side]: selectedTeam
    } : match));
    setShowPredictions(false);
    setPredictions([]);
  };
  const getAvailableTeams = (currentMatch: number, side: "home" | "away") => {
    const selectedValues = matches.flatMap((match, index) => {
      if (index === currentMatch) {
        const opposing = side === "home" ? match.away : match.home;
        return opposing ? [opposing.value] : [];
      }
      const values: string[] = [];
      if (match.home) values.push(match.home.value);
      if (match.away) values.push(match.away.value);
      return values;
    }).filter(Boolean);
    return teams.filter(team => !selectedValues.includes(team.value));
  };
  const completedMatches = matches.filter(isCompletedMatch);
  const canPredict = completedMatches.length === MATCH_COUNT;
  const progress = completedMatches.length / MATCH_COUNT * 100;
  const runPredictions = async () => {
    setIsLoading(true);
    setPredictions([]);
    try {
      const leagueMeta = LEAGUE_METADATA[league];
      const {
        data: leagueRecord,
        error: leagueError
      } = await supabase.from("leagues").select("id, name").eq("name", leagueMeta.supabaseName).single();
      if (leagueError || !leagueRecord) {
        throw new Error("Nem sikerült azonosítani a ligát a Supabase-ben");
      }
      const {
        data: allTeams,
        error: teamsError
      } = await supabase.from("teams").select("id, name").eq("league_id", leagueRecord.id);
      if (teamsError || !allTeams) {
        throw new Error("Nem sikerült lekérni a csapatokat a Supabase-ből");
      }
      const teamMap = new Map(allTeams.map((team: {
        name: string;
        id: string;
      }) => [team.name, team.id]));
      const predictionPromises = completedMatches.map(async match => {
        const homeTeamId = teamMap.get(match.home.value);
        const awayTeamId = teamMap.get(match.away.value);
        if (!homeTeamId || !awayTeamId) {
          console.warn("Hiányzó csapat ID a Supabase-ben", match);
          return null;
        }
        const {
          data: insertedMatch,
          error: insertError
        } = await supabase.from("matches").insert({
          league_id: leagueRecord.id,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          match_date: new Date().toISOString(),
          status: "scheduled"
        }).select("id").single();
        if (insertError || !insertedMatch) {
          console.error("Hiba történt a mérkőzés mentésekor", insertError);
          return null;
        }
        const {
          data: predictionData,
          error: predictionError
        } = await supabase.functions.invoke("analyze-match", {
          body: {
            matchId: insertedMatch.id
          }
        });
        if (predictionError) {
          console.error("Prediction error:", predictionError);
          return null;
        }
        const normalizedPatterns: NormalizedPattern[] = (predictionData?.patterns ?? []).map((pattern: RawPatternResponse, idx: number) => ({
          key: pattern.template_name ?? `pattern-${idx}`,
          name: formatPatternName(pattern.template_name),
          confidence_boost: pattern.confidence_boost ?? 0,
          data: pattern.data
        }));
        return {
          match: {
            home: match.home.label,
            away: match.away.label
          },
          matchId: insertedMatch.id,
          prediction: predictionData?.prediction,
          patterns: normalizedPatterns,
          formScores: predictionData?.form_scores ?? undefined
        } as NormalizedPrediction;
      });
      const results = await Promise.all(predictionPromises);
      const validResults = results.filter((result): result is NormalizedPrediction => result !== null);
      if (validResults.length === 0) {
        toast.error("Nem sikerült predikciót készíteni a kiválasztott mérkőzésekre");
        setShowPredictions(false);
        return;
      }
      setPredictions(validResults);
      setShowPredictions(true);
      toast.success(`${validResults.length} predikció elkészült!`);
    } catch (error) {
      console.error("Error running predictions:", error);
      toast.error("Hiba történt a predikciók futtatása során");
    } finally {
      setIsLoading(false);
    }
  };
  return <section id="match-selection" className="scroll-mt-24 ml-0 md:ml-[84px] py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-primary/20 bg-primary/10 px-2.5 py-1 mb-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-primary font-semibold">Mérkőzések kiválasztása</span>
            </div>
            <h2 className="text-2xl sm:text-3xl tracking-tight text-foreground font-semibold">Válaszd ki a csapatokat</h2>
            <p className="text-muted-foreground mt-1">
              Válassz Otthon/Vendég csapatot. A már kiválasztott csapatok nem jelennek meg újra.
            </p>

            <div className="mt-4 inline-flex items-center rounded-lg bg-muted p-1 ring-1 ring-border">
              <button onClick={() => handleLeagueChange("angol")} className={`px-4 py-2 rounded-md text-sm font-semibold transition ${league === "angol" ? "bg-card text-foreground ring-1 ring-border shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Angol Bajnokság
              </button>
              <button onClick={() => handleLeagueChange("spanyol")} className={`px-4 py-2 rounded-md text-sm font-semibold transition ${league === "spanyol" ? "bg-card text-foreground ring-1 ring-border shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Spanyol Bajnokság
              </button>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2 w-40 rounded-full bg-muted overflow-hidden ring-1 ring-border">
              <div className="h-full bg-primary transition-all" style={{
              width: `${progress}%`
            }}></div>
            </div>
            <span className="text-xs text-muted-foreground">{completedMatches.length} / {MATCH_COUNT} kész</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {matches.map((match, index) => <MatchCard key={index} match={match} index={index} availableTeams={{
          home: getAvailableTeams(index, "home"),
          away: getAvailableTeams(index, "away")
        }} onMatchChange={handleMatchChange} />)}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Tipp: Keress csapatra gyorsan a lenyíló menüben a billentyűzettel.
          </div>
          <div className="flex items-center gap-3">
            <div className="sm:hidden flex items-center gap-2">
              <div className="h-2 w-28 rounded-full bg-muted overflow-hidden ring-1 ring-border">
                <div className="h-full bg-primary transition-all" style={{
                width: `${progress}%`
              }}></div>
              </div>
              <span className="text-xs text-muted-foreground">{completedMatches.length} / {MATCH_COUNT}</span>
            </div>
            <Button disabled={!canPredict || isLoading} onClick={runPredictions} className="group relative overflow-hidden inline-flex items-center gap-2 h-10 px-4 rounded-md bg-gradient-to-r from-primary to-primary text-primary-foreground ring-1 ring-primary hover:ring-primary/80 transition text-sm font-semibold disabled:opacity-50">
              <span className="relative z-10 inline-flex items-center gap-2">
                {isLoading ? <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Predikciók futtatása...
                  </> : <>
                    Predikciók futtatása
                    <ArrowRight className="w-4 h-4" />
                  </>}
              </span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 bg-gradient-to-r from-white/0 via-white/40 to-white/0"></span>
            </Button>
          </div>
        </div>

        {showPredictions && predictions.length > 0 && <PredictionResults predictions={predictions} />}
      </div>
    </section>;
};
export default MatchSelection;