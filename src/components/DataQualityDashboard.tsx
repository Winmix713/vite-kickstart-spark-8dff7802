import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
interface DataQualityLog {
  id: string;
  data_source: string;
  completeness_score: number;
  accuracy_score: number;
  freshness_score: number;
  consistency_score: number;
  issues_found: string[];
  created_at: string;
}
export const DataQualityDashboard = () => {
  const {
    data: qualityLogs,
    isLoading
  } = useQuery({
    queryKey: ['data-quality-logs'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('data_quality_logs').select('*').order('created_at', {
        ascending: false
      }).limit(5);
      if (error) throw error;
      return data as DataQualityLog[];
    }
  });
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Data Quality</CardTitle>
          <CardDescription>Loading quality metrics...</CardDescription>
        </CardHeader>
      </Card>;
  }
  const latestLog = qualityLogs?.[0];
  const avgScores = qualityLogs?.reduce((acc, log) => ({
    completeness: acc.completeness + log.completeness_score,
    accuracy: acc.accuracy + log.accuracy_score,
    freshness: acc.freshness + log.freshness_score,
    consistency: acc.consistency + log.consistency_score
  }), {
    completeness: 0,
    accuracy: 0,
    freshness: 0,
    consistency: 0
  });
  const count = qualityLogs?.length || 1;
  const overallScore = avgScores ? (avgScores.completeness + avgScores.accuracy + avgScores.freshness + avgScores.consistency) / (count * 4) : 0;
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <TrendingUp className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getScoreIcon(overallScore)}
          Data Quality Dashboard
        </CardTitle>
        <CardDescription>
          Overall Score: <span className={getScoreColor(overallScore)}>{overallScore.toFixed(1)}%</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {latestLog && <>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Completeness</span>
                  <span className={`text-sm font-semibold ${getScoreColor(latestLog.completeness_score)}`}>
                    {latestLog.completeness_score.toFixed(1)}%
                  </span>
                </div>
                <Progress value={latestLog.completeness_score} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Accuracy</span>
                  <span className={`text-sm font-semibold ${getScoreColor(latestLog.accuracy_score)}`}>
                    {latestLog.accuracy_score.toFixed(1)}%
                  </span>
                </div>
                <Progress value={latestLog.accuracy_score} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Freshness</span>
                  <span className={`text-sm font-semibold ${getScoreColor(latestLog.freshness_score)}`}>
                    {latestLog.freshness_score.toFixed(1)}%
                  </span>
                </div>
                <Progress value={latestLog.freshness_score} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Consistency</span>
                  <span className={`text-sm font-semibold ${getScoreColor(latestLog.consistency_score)}`}>
                    {latestLog.consistency_score.toFixed(1)}%
                  </span>
                </div>
                <Progress value={latestLog.consistency_score} className="h-2" />
              </div>
            </div>

            {latestLog.issues_found && latestLog.issues_found.length > 0 && <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Issues Found:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {latestLog.issues_found.map((issue, idx) => <li key={idx} className="text-sm">{issue}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>}

            <p className="text-xs text-muted-foreground">
              Last checked: {new Date(latestLog.created_at).toLocaleString()}
            </p>
          </>}

        {!latestLog && <p className="text-sm text-muted-foreground">No quality data available yet.</p>}
      </CardContent>
    </Card>;
};