import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Star } from "lucide-react";
import { useState } from "react";
import FeedbackForm from "./FeedbackForm";
interface PatternDisplay {
  key?: string;
  name: string;
  confidence_boost: number;
  data?: Record<string, unknown>;
}
interface PredictionSummary {
  predicted_outcome?: string;
  confidence_score?: number;
  actual_outcome?: string | null;
  was_correct?: boolean | null;
}
interface ValueRankingData {
  value_score: number;
  is_featured: boolean;
  home_xg?: number;
  away_xg?: number;
  btts_probability?: number;
}
interface PredictionResultItem {
  match: {
    home: string;
    away: string;
  };
  matchId: string;
  prediction?: PredictionSummary;
  patterns: PatternDisplay[];
  formScores?: {
    home: number;
    away: number;
  };
  value_ranking?: ValueRankingData;
}
interface PredictionResultsProps {
  predictions: PredictionResultItem[];
}
const PredictionResults = ({
  predictions
}: PredictionResultsProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<number>>(new Set());
  const handleFeedbackSubmit = (index: number) => {
    setFeedbackSubmitted(prev => new Set([...prev, index]));
    setExpandedIndex(null);
  };

  // Sort predictions by value score (descending) if available
  const sortedPredictions = [...predictions].sort((a, b) => {
    const aScore = a.value_ranking?.value_score ?? 0;
    const bScore = b.value_ranking?.value_score ?? 0;
    return bScore - aScore;
  });
  return <div className="glass-card rounded-3xl p-6 animate-fade-in mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">
          Predikciós Eredmények
        </h3>
        <div className="flex items-center gap-2 text-xs text-blue-300">
          <Star className="w-4 h-4" />
          <span>Top 2 értékajánlat (Value Betting)</span>
        </div>
      </div>
      
      <div className="grid gap-4">
        {sortedPredictions.map((pred, index) => {
        const match = pred.match;
        const prediction = pred.prediction;
        const patternList = pred.patterns ?? [];
        const formScores = pred.formScores;
        const outcomeRaw = prediction?.predicted_outcome ?? "home_win";
        const normalizedOutcome = ["home_win", "away_win", "draw"].includes(outcomeRaw) ? outcomeRaw as "home_win" | "away_win" | "draw" : "home_win";
        const confidenceRaw = prediction?.confidence_score ?? 50;
        const confidence = Math.min(Math.max(confidenceRaw, 0), 100);
        const confidenceDisplay = Math.round(confidence);
        const fallbackProb = Math.round((100 - confidence) / 2);
        let homeProb = fallbackProb;
        let awayProb = fallbackProb;
        if (normalizedOutcome === "home_win") {
          homeProb = Math.round(confidence);
        } else if (normalizedOutcome === "away_win") {
          awayProb = Math.round(confidence);
        }
        const drawProb = Math.max(0, 100 - homeProb - awayProb);
        const isFeatured = pred.value_ranking?.is_featured ?? false;
        const valueScore = pred.value_ranking?.value_score ?? 0;
        return <div key={index} className={`glass-card-hover rounded-2xl p-5 relative ${isFeatured ? 'ring-2 ring-yellow-400/50 bg-yellow-500/5' : ''}`}>
              {isFeatured && <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/30">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-300">Ajánlott</span>
                </div>}
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 text-center">
                  <p className="font-bold text-white">{match.home}</p>
                  {formScores && <p className="text-xs text-gray-400 mt-1">Forma: {formScores.home}%</p>}
                </div>
                <div className="px-4">
                  <span className="text-gray-400">vs</span>
                </div>
                <div className="flex-1 text-center">
                  <p className="font-bold text-white">{match.away}</p>
                  {formScores && <p className="text-xs text-gray-400 mt-1">Forma: {formScores.away}%</p>}
                </div>
              </div>

              {/* Value Betting Info */}
              {valueScore > 0 && <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-400/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-300 mb-1">Value Score</p>
                      <p className="text-lg font-bold text-blue-400">{valueScore.toFixed(2)}</p>
                    </div>
                    {pred.value_ranking?.home_xg !== undefined && pred.value_ranking?.away_xg !== undefined && <div className="text-right">
                        <p className="text-xs text-blue-300">Várható gólok</p>
                        <p className="text-sm text-blue-400 font-semibold">
                          {pred.value_ranking.home_xg.toFixed(1)} - {pred.value_ranking.away_xg.toFixed(1)}
                        </p>
                      </div>}
                    {pred.value_ranking?.btts_probability !== undefined && <div className="text-right">
                        <p className="text-xs text-blue-300">BTTS %</p>
                        <p className="text-sm text-blue-400 font-semibold">
                          {Math.round(pred.value_ranking.btts_probability)}%
                        </p>
                      </div>}
                  </div>
                </div>}

              {/* Confidence Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Biztos predikció</span>
                  <span>{confidenceDisplay}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all" style={{
                width: `${confidence}%`
              }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className={`text-center p-3 rounded-xl ${normalizedOutcome === 'home_win' ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-white/5'}`}>
                  <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${normalizedOutcome === 'home_win' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <p className="text-sm text-gray-400">Hazai</p>
                  <p className="font-bold text-white">{homeProb}%</p>
                </div>

                <div className={`text-center p-3 rounded-xl ${normalizedOutcome === 'draw' ? 'bg-gray-500/20 border border-gray-400/30' : 'bg-white/5'}`}>
                  <Minus className={`w-5 h-5 mx-auto mb-1 ${normalizedOutcome === 'draw' ? 'text-gray-300' : 'text-gray-400'}`} />
                  <p className="text-sm text-gray-400">Döntetlen</p>
                  <p className="font-bold text-white">{drawProb}%</p>
                </div>

                <div className={`text-center p-3 rounded-xl ${normalizedOutcome === 'away_win' ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-white/5'}`}>
                  <TrendingDown className={`w-5 h-5 mx-auto mb-1 ${normalizedOutcome === 'away_win' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <p className="text-sm text-gray-400">Vendég</p>
                  <p className="font-bold text-white">{awayProb}%</p>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-white/10 mb-3">
                <p className="text-sm text-gray-400 mb-1">Ajánlott tipp</p>
                <p className="font-bold text-blue-400">
                  {normalizedOutcome === 'home_win' ? `${match.home} győzelem` : normalizedOutcome === 'away_win' ? `${match.away} győzelem` : 'Döntetlen'}
                </p>
              </div>

              {/* Detected Patterns */}
              {patternList.length > 0 && <div className="pt-3 border-t border-white/10 mb-3">
                  <p className="text-xs text-gray-400 mb-2">Észlelt minták:</p>
                  <div className="flex flex-wrap gap-2">
                    {patternList.map((pattern, i) => <span key={pattern.key ?? i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs text-blue-300">
                        {pattern.name} (+{pattern.confidence_boost}%)
                      </span>)}
                  </div>
                </div>}

              {/* Feedback Form Toggle */}
              {!feedbackSubmitted.has(index) && <button onClick={() => setExpandedIndex(expandedIndex === index ? null : index)} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm text-gray-300">
                  {expandedIndex === index ? <>
                      <ChevronUp className="w-4 h-4" />
                      Feedback form bezárása
                    </> : <>
                      <ChevronDown className="w-4 h-4" />
                      Eredmény megadása
                    </>}
                </button>}

              {feedbackSubmitted.has(index) && <div className="text-center py-2 text-sm text-green-400">
                  ✓ Feedback elküldve
                </div>}

              {expandedIndex === index && !feedbackSubmitted.has(index) && <div className="mt-3 pt-3 border-t border-white/10">
                  <FeedbackForm matchId={pred.matchId} homeTeam={match.home} awayTeam={match.away} onSubmitted={() => handleFeedbackSubmit(index)} />
                </div>}
            </div>;
      })}
      </div>
    </div>;
};
export default PredictionResults;