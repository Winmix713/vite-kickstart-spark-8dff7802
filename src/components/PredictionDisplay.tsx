import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Trophy, Target, TrendingUp, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { EnsembleBreakdown } from '@/types/sportradar';
interface Pattern {
  template_name: string;
  confidence_boost: number;
  data: Record<string, unknown>;
}
interface ExplanationFactor {
  factor: string;
  weight: number;
  contribution: string;
  details: string;
}
interface ConfidenceBreakdown {
  base_confidence: number;
  pattern_boost: number;
  final_confidence: number;
}
interface Explanation {
  summary: string;
  key_factors: ExplanationFactor[];
  decision_tree: string[];
  confidence_breakdown: ConfidenceBreakdown;
}
interface DecisionNode {
  id: number;
  type: 'root' | 'branch' | 'leaf';
  condition: string;
  result?: boolean;
  outcome?: string;
  confidence_contribution?: number;
  next_node?: number;
}
interface DecisionPath {
  nodes: DecisionNode[];
}
interface PredictionDisplayProps {
  prediction: {
    predicted_outcome: string;
    confidence_score: number;
    btts_prediction?: boolean;
    ensemble_breakdown?: EnsembleBreakdown;
  };
  patterns?: Pattern[];
  formScores?: {
    home: number;
    away: number;
  } | null;
  explanation?: Explanation;
  decisionPath?: DecisionPath;
  predictionStatus?: 'active' | 'uncertain' | 'blocked';
  overconfidenceFlag?: boolean;
  blockedReason?: string;
  alternateOutcome?: string;
  downgradedFromConfidence?: number;
}
const PATTERN_LABELS: Record<string, string> = {
  home_winning_streak: 'Hazai győzelmi széria',
  away_winning_streak: 'Vendég győzelmi széria',
  h2h_dominance: 'H2H dominancia',
  recent_form_advantage: 'Forma előny',
  high_scoring_league: 'Gólgazdag liga'
};
const PATTERN_ICONS: Record<string, LucideIcon> = {
  home_winning_streak: Trophy,
  away_winning_streak: Trophy,
  h2h_dominance: Target,
  recent_form_advantage: TrendingUp,
  high_scoring_league: CheckCircle2
};
const ENSEMBLE_MODEL_LABELS: Record<'full_time' | 'half_time' | 'pattern', string> = {
  full_time: 'Teljes idejű modell',
  half_time: 'Félidős modell',
  pattern: 'Mintázat-alapú modell'
};
const ENSEMBLE_SCORE_LABELS: Record<'HOME' | 'DRAW' | 'AWAY', string> = {
  HOME: 'Hazai győzelem',
  DRAW: 'Döntetlen',
  AWAY: 'Vendég győzelem'
};
const translateOutcome = (outcome?: string) => {
  switch (outcome) {
    case 'home_win':
    case 'HOME':
      return 'Hazai győzelem';
    case 'away_win':
    case 'AWAY':
      return 'Vendég győzelem';
    case 'draw':
    case 'DRAW':
      return 'Döntetlen';
    default:
      return outcome || 'Nincs';
  }
};
export default function PredictionDisplay({
  prediction,
  patterns = [],
  formScores,
  explanation,
  decisionPath,
  predictionStatus = 'active',
  overconfidenceFlag = false,
  blockedReason,
  alternateOutcome,
  downgradedFromConfidence
}: PredictionDisplayProps) {
  const [expandedDecision, setExpandedDecision] = useState(false);
  const [expandedExplanation, setExpandedExplanation] = useState(false);
  const [expandedEnsemble, setExpandedEnsemble] = useState(false);
  const ensemble = prediction.ensemble_breakdown as EnsembleBreakdown | undefined;
  const outcomeLabel = translateOutcome(prediction.predicted_outcome);
  const ensembleConflictReason = predictionStatus === 'uncertain' && !overconfidenceFlag && ensemble?.conflict_detected ? `Ensemble konfliktus: a két legmagasabb pontszám közötti különbség ${(ensemble.conflict_margin * 100).toFixed(1)}% (küszöb: 10%).` : undefined;
  const effectiveBlockedReason = blockedReason || ensembleConflictReason;
  const confidenceColor = prediction.confidence_score >= 70 ? 'text-green-600' : prediction.confidence_score >= 55 ? 'text-yellow-600' : 'text-red-600';
  const getStatusBadgeVariant = () => {
    switch (predictionStatus) {
      case 'active':
        return 'default';
      case 'uncertain':
        return 'secondary';
      case 'blocked':
        return 'destructive';
      default:
        return 'default';
    }
  };
  const getStatusLabel = () => {
    switch (predictionStatus) {
      case 'active':
        return 'Megerősített előrejelzés';
      case 'uncertain':
        return 'Downgrade - Előzetes hiba miatt';
      case 'blocked':
        return 'Letiltott - Lásd az okot';
      default:
        return 'Aktív';
    }
  };
  const getAlternateOutcomeLabel = (outcome?: string) => translateOutcome(outcome);
  return <div className="space-y-6">
      {/* Status and Alerts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Előrejelzés státusza:</span>
          <Badge variant={getStatusBadgeVariant()}>
            {getStatusLabel()}
          </Badge>
        </div>

        {predictionStatus === 'uncertain' && effectiveBlockedReason && <Alert variant="warning" className="border-yellow-500/50 bg-yellow-50/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle>Konfidencia Downgrade</AlertTitle>
            <AlertDescription>
              <div className="text-sm space-y-2">
                <p>{effectiveBlockedReason}</p>
                {downgradedFromConfidence && <div>
                    <span className="font-medium">Eredeti: {(downgradedFromConfidence * 100).toFixed(1)}%</span>
                    {' → '}
                    <span className="font-medium">Jelenlegi: {prediction.confidence_score.toFixed(1)}%</span>
                  </div>}
                {alternateOutcome && <p>
                    <span className="font-medium">Alternatíva:</span> {getAlternateOutcomeLabel(alternateOutcome)}
                  </p>}
              </div>
            </AlertDescription>
          </Alert>}

        {predictionStatus === 'blocked' && blockedReason && <Alert variant="destructive" className="border-red-500/50 bg-red-50/10">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle>Előrejelzés Letiltva</AlertTitle>
            <AlertDescription className="text-sm">{blockedReason}</AlertDescription>
          </Alert>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Predikció Eredmény
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Előrejelzett kimenetel:</span>
              <Badge variant="default" className="text-lg px-4 py-1">
                {outcomeLabel}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Megbízhatósági pontszám</span>
                <span className={`text-2xl font-bold ${confidenceColor}`}>
                  {prediction.confidence_score.toFixed(1)}%
                </span>
              </div>
              <Progress value={prediction.confidence_score} className="h-3" />
            </div>

            {prediction.btts_prediction !== undefined && <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm">Mindkét csapat szerez gólt (BTTS):</span>
                <Badge variant={prediction.btts_prediction ? 'default' : 'secondary'}>
                  {prediction.btts_prediction ? 'Igen' : 'Nem'}
                </Badge>
              </div>}
          </div>
        </CardContent>
      </Card>

      {prediction.ensemble_breakdown && <Card>
          <CardHeader>
            <button onClick={() => setExpandedEnsemble(!expandedEnsemble)} className="w-full flex items-center justify-between hover:opacity-70 transition">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Ensemble Előrejelzés Lebontása
              </CardTitle>
              {expandedEnsemble ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </CardHeader>
          {expandedEnsemble && <CardContent className="space-y-4">
              {prediction.ensemble_breakdown.conflict_detected && <Alert variant="warning" className="border-yellow-500/50 bg-yellow-50/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle>Alacsony Biztonságú Predikció</AlertTitle>
                  <AlertDescription className="text-sm">
                    A modellek között konfliktus észlelve: a két legmagasabb pontszám közötti különbség {' '}
                    {(prediction.ensemble_breakdown.conflict_margin * 100).toFixed(1)}% (küszöb: 10%)
                  </AlertDescription>
                </Alert>}

              <div>
                <h4 className="font-medium text-sm mb-3">Sub-model Szavazatok:</h4>
                <div className="space-y-2">
                  {(['full_time', 'half_time', 'pattern'] as const).map(modelKey => {
              const vote = prediction.ensemble_breakdown.votes[modelKey];
              if (!vote) return null;
              const weightKey = modelKey === 'full_time' ? 'ft' : modelKey === 'half_time' ? 'ht' : 'pt';
              const isOpposing = vote.prediction !== prediction.ensemble_breakdown.winner;
              const containerClasses = isOpposing ? 'border border-red-500/50 bg-red-50/10' : 'border border-transparent bg-muted/30';
              return <div key={modelKey} className={`p-3 rounded-lg ${containerClasses}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{ENSEMBLE_MODEL_LABELS[modelKey]}</span>
                          <Badge variant={isOpposing ? 'destructive' : 'outline'}>
                            Súly: {(prediction.ensemble_breakdown.weights_used[weightKey] * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${isOpposing ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                            {translateOutcome(vote.prediction)}
                          </span>
                          <span className="text-xs font-medium">
                            {(vote.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        {isOpposing && <p className="text-xs text-red-600 font-medium mt-2">
                            Felülbírálva az ensemble által
                          </p>}
                      </div>;
            })}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Végső Pontszámok:</h4>
                <div className="space-y-2">
                  {(['HOME', 'DRAW', 'AWAY'] as const).map(scoreKey => <div key={scoreKey} className="flex items-center justify-between">
                      <span className="text-sm">{ENSEMBLE_SCORE_LABELS[scoreKey]}:</span>
                      <div className="flex items-center gap-2 flex-1 ml-4">
                        <Progress value={prediction.ensemble_breakdown.scores[scoreKey] * 100} className="h-2" />
                        <span className="text-sm font-medium min-w-12 text-right">
                          {(prediction.ensemble_breakdown.scores[scoreKey] * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>)}
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nyertes:</span>
                  <Badge variant="default">
                    {translateOutcome(prediction.ensemble_breakdown.winner)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium">Végső konfidencia:</span>
                  <span className="text-sm font-bold">
                    {(prediction.ensemble_breakdown.final_confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>}
        </Card>}

      {patterns.length > 0 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Detektált Pattern-ek
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patterns.map((pattern, index) => {
            const Icon = PATTERN_ICONS[pattern.template_name] || CheckCircle2;
            return <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">
                          {PATTERN_LABELS[pattern.template_name] || pattern.template_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {JSON.stringify(pattern.data)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      +{pattern.confidence_boost.toFixed(1)}%
                    </Badge>
                  </div>;
          })}
            </div>
          </CardContent>
        </Card>}

      {formScores && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Forma Pontszámok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Hazai csapat</p>
                <p className="text-3xl font-bold">{formScores.home}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Vendég csapat</p>
                <p className="text-3xl font-bold">{formScores.away}</p>
              </div>
            </div>
          </CardContent>
        </Card>}

      {explanation && <Card>
          <CardHeader>
            <button onClick={() => setExpandedExplanation(!expandedExplanation)} className="w-full flex items-center justify-between hover:opacity-70 transition">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Magyarázat és Elemzés
              </CardTitle>
              {expandedExplanation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </CardHeader>
          {expandedExplanation && <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">{explanation.summary}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-3">Fő Tényezők:</h4>
                <div className="space-y-2">
                  {explanation.key_factors.map((factor, idx) => <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{factor.factor}</span>
                        <span className="text-xs text-muted-foreground">
                          Súly: {(factor.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{factor.details}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Hozzájárulás:</span>
                        <span className="text-xs font-medium text-green-600">
                          {factor.contribution}
                        </span>
                      </div>
                    </div>)}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Döntési Fa:</h4>
                <div className="space-y-1">
                  {explanation.decision_tree.map((step, idx) => <div key={idx} className="text-xs text-muted-foreground pl-3 py-1 border-l-2 border-muted">
                      {step}
                    </div>)}
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Konfidencia Lebontása:</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Alap konfidencia:</span>
                    <span>{(explanation.confidence_breakdown.base_confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minta Boost:</span>
                    <span className="text-green-600">
                      +{(explanation.confidence_breakdown.pattern_boost * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Végső konfidencia:</span>
                    <span>{(explanation.confidence_breakdown.final_confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>}
        </Card>}

      {decisionPath && <Card>
          <CardHeader>
            <button onClick={() => setExpandedDecision(!expandedDecision)} className="w-full flex items-center justify-between hover:opacity-70 transition">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Döntési Útvonal
              </CardTitle>
              {expandedDecision ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </CardHeader>
          {expandedDecision && <CardContent>
              <div className="space-y-3">
                {decisionPath.nodes.map((node, idx) => <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="min-w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        {node.id}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-1 bg-muted rounded">
                            {node.type}
                          </span>
                          {node.outcome && <span className="text-xs text-green-600 font-medium">
                              → {node.outcome}
                            </span>}
                        </div>
                        <p className="text-sm text-muted-foreground">{node.condition}</p>
                        {node.confidence_contribution && <p className="text-xs text-muted-foreground mt-1">
                            Konfidencia hozzájárulás: {(node.confidence_contribution * 100).toFixed(1)}%
                          </p>}
                      </div>
                    </div>
                  </div>)}
              </div>
            </CardContent>}
        </Card>}
    </div>;
}