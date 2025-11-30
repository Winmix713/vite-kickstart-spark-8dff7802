import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Clock } from "lucide-react";
interface Pattern {
  id: string;
  team_name: string;
  pattern_type: string;
  pattern_data: any;
  confidence: number;
  detected_at: string;
  expires_at: string | null;
}
export const PatternsDisplay = ({
  teamName
}: {
  teamName?: string;
}) => {
  const {
    data: patterns,
    isLoading
  } = useQuery({
    queryKey: ['team-patterns', teamName],
    queryFn: async () => {
      let query = supabase.from('team_patterns').select('*').order('confidence', {
        ascending: false
      });
      if (teamName) {
        query = query.eq('team_name', teamName);
      }
      const {
        data,
        error
      } = await query.limit(10);
      if (error) throw error;
      return data as Pattern[];
    }
  });
  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'streak':
        return <TrendingUp className="h-4 w-4" />;
      case 'scoring_timing':
        return <Clock className="h-4 w-4" />;
      case 'venue_performance':
        return <Target className="h-4 w-4" />;
      case 'btts_tendency':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };
  const getPatternColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-blue-500";
  };
  const formatPatternTitle = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  const formatPatternDescription = (pattern: Pattern) => {
    const {
      pattern_type,
      pattern_data
    } = pattern;
    switch (pattern_type) {
      case 'streak':
        return `${pattern_data.streak_length} ${pattern_data.streak_type} streak`;
      case 'scoring_timing':
        return `${pattern_data.timing === 'early_scorer' ? 'Early scorer' : 'Late bloomer'} (${pattern_data.first_half_percentage}% first half)`;
      case 'venue_performance':
        return `Stronger ${pattern_data.stronger_venue} (${pattern_data.difference}% difference)`;
      case 'btts_tendency':
        return `${pattern_data.tendency === 'high' ? 'High' : 'Low'} BTTS (${pattern_data.btts_percentage}%)`;
      default:
        return 'Unknown pattern';
    }
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Detected Patterns</CardTitle>
          <CardDescription>Loading patterns...</CardDescription>
        </CardHeader>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>Detected Patterns</CardTitle>
        <CardDescription>
          {teamName ? `Patterns for ${teamName}` : 'Recent patterns across all teams'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {patterns && patterns.length > 0 ? <div className="space-y-4">
            {patterns.map(pattern => <div key={pattern.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                <div className="mt-1">
                  {getPatternIcon(pattern.pattern_type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{pattern.team_name}</p>
                    <Badge className={getPatternColor(pattern.confidence)}>
                      {pattern.confidence.toFixed(0)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatPatternTitle(pattern.pattern_type)}
                  </p>
                  <p className="text-sm">{formatPatternDescription(pattern)}</p>
                  {pattern.expires_at && <p className="text-xs text-muted-foreground">
                      Expires: {new Date(pattern.expires_at).toLocaleDateString()}
                    </p>}
                </div>
              </div>)}
          </div> : <p className="text-sm text-muted-foreground">
            No patterns detected yet. Patterns will appear after analyzing match data.
          </p>}
      </CardContent>
    </Card>;
};