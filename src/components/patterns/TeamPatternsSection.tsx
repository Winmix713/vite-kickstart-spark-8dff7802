import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import PatternBadge from "./PatternBadge";
import type { PatternTypeKey } from "./PatternBadge.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, RefreshCw, CheckCircle2, Clock } from "lucide-react";
interface TeamPatternRow {
  id: string;
  team_id: string;
  pattern_type: PatternTypeKey | string;
  pattern_name: string;
  confidence: number;
  strength: number;
  valid_from: string;
  valid_until: string | null;
  prediction_impact: number;
  historical_accuracy: number;
  pattern_metadata: Record<string, unknown> | null;
}
interface PatternsResponse {
  team_id: string;
  team_name: string;
  active_patterns: TeamPatternRow[];
  expired_patterns: TeamPatternRow[];
}
export function TeamPatternsSection({
  teamName
}: {
  teamName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [data, setData] = useState<PatternsResponse | null>(null);
  const [showExpired, setShowExpired] = useState(false);
  const [autoTried, setAutoTried] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("patterns-team", {
        body: {
          team_name: teamName
        }
      });
      if (error) throw error;
      setData(data as PatternsResponse);
    } catch (e) {
      console.error("Failed to load team patterns", e);
      setData({
        team_id: "",
        team_name: teamName,
        active_patterns: [],
        expired_patterns: []
      });
    } finally {
      setLoading(false);
    }
  }, [teamName]);
  const runDetect = useCallback(async () => {
    setVerifying(true);
    try {
      await supabase.functions.invoke("patterns-detect", {
        body: {
          team_name: teamName
        }
      });
      await load();
    } catch (e) {
      console.error("Failed to detect patterns", e);
    } finally {
      setVerifying(false);
    }
  }, [teamName, load]);
  const runVerify = useCallback(async () => {
    setVerifying(true);
    try {
      await supabase.functions.invoke("patterns-verify", {
        body: {
          team_name: teamName
        }
      });
      await load();
    } catch (e) {
      console.error("Failed to verify patterns", e);
    } finally {
      setVerifying(false);
    }
  }, [teamName, load]);
  useEffect(() => {
    load();
    setAutoTried(false);
  }, [teamName, load]);
  useEffect(() => {
    if (!loading && !verifying && !autoTried && data && data.active_patterns.length === 0) {
      setAutoTried(true);
      runDetect();
    }
  }, [loading, verifying, autoTried, data, runDetect]);
  return <Card className="rounded-2xl bg-card ring-1 ring-border">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Csapat mintázatok</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={runDetect} disabled={verifying}>
            {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Detektálás
          </Button>
          <Button size="sm" onClick={runVerify} disabled={verifying}>
            {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Újraellenőrzés
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Betöltés...</div> : <div className="space-y-6">
            <div>
              <div className="text-sm font-semibold mb-2">Aktív mintázatok</div>
              {data?.active_patterns?.length ? <div className="flex flex-wrap gap-2">
                  {data!.active_patterns.map(p => <PatternBadge key={p.id} type={p.pattern_type as PatternTypeKey} name={p.pattern_name} confidence={Math.round(p.confidence)} strength={p.strength} metadata={p.pattern_metadata ?? undefined} />)}
                </div> : <div className="text-sm text-muted-foreground">Nincsenek aktív mintázatok ehhez a csapathoz.</div>}
            </div>

            <Collapsible open={showExpired} onOpenChange={setShowExpired}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Lejárt mintázatok</div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Clock className="w-4 h-4 mr-2" />
                    {showExpired ? "Elrejt" : "Mutat"}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data?.expired_patterns?.length ? data!.expired_patterns.map(p => <PatternBadge key={p.id} type={p.pattern_type as PatternTypeKey} name={p.pattern_name} confidence={Math.round(p.confidence)} strength={p.strength} metadata={p.pattern_metadata ?? undefined} />) : <div className="text-sm text-muted-foreground">Nincs megjeleníthető lejárt minta.</div>}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>}
      </CardContent>
    </Card>;
}
export default TeamPatternsSection;