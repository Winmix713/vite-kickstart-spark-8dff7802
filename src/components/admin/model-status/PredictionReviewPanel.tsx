import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getBlockedPredictions, submitPredictionReview, type BlockedPrediction } from "@/integrations/admin-prediction-review/service";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
const HUNGARIAN_LABELS = {
  accept: "Elfogadás",
  reject: "Elutasítás",
  no_blocked: "Nincsenek blokkolt előrejelzések",
  loading: "Betöltés...",
  error: "Hiba az adatok betöltésekor",
  success_accept: "Előrejelzés elfogadva",
  success_reject: "Előrejelzés elutasítva",
  error_action: "Hiba az akció végrehajtásakor"
};
interface PredictionReviewPanelProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}
export function PredictionReviewPanel({
  autoRefresh = true,
  refreshInterval = 30000
}: PredictionReviewPanelProps) {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["blocked-predictions", offset, limit],
    queryFn: () => getBlockedPredictions(limit, offset),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000
  });
  const reviewMutation = useMutation({
    mutationFn: submitPredictionReview,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["blocked-predictions"]
      });
      const action = variables.action === "accepted" ? "elfogadva" : "elutasítva";
      toast({
        title: HUNGARIAN_LABELS[`success_${variables.action}`],
        description: `Előrejelzés sikeresen ${action}`,
        variant: "default"
      });
    },
    onError: error => {
      toast({
        title: HUNGARIAN_LABELS.error_action,
        description: error instanceof Error ? error.message : "Ismeretlen hiba",
        variant: "destructive"
      });
    }
  });
  const predictions = response?.data || [];
  const pagination = response?.pagination;
  const handleReviewAction = useCallback((predictionId: string, action: "accepted" | "rejected", notes?: string) => {
    reviewMutation.mutate({
      predictionId,
      action,
      notes
    });
  }, [reviewMutation]);
  const handleRefresh = () => {
    refetch();
  };
  const handleNextPage = () => {
    if (pagination && offset + limit < pagination.total) {
      setOffset(offset + limit);
    }
  };
  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };
  if (isLoading && !predictions.length) {
    return <Card>
        <CardHeader>
          <CardTitle>Blokkolt előrejelzések felülvizsgálata</CardTitle>
          <CardDescription>
            Adminok felülvizsgálatára váró előrejelzések
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">{HUNGARIAN_LABELS.loading}</p>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card>
        <CardHeader>
          <CardTitle>Blokkolt előrejelzések felülvizsgálata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{HUNGARIAN_LABELS.error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Újrapróbálás
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Blokkolt előrejelzések felülvizsgálata</CardTitle>
          <CardDescription>
            {predictions.length} előrejelzés felülvizsgálatra vár
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={reviewMutation.isPending}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {predictions.length === 0 ? <div className="text-center py-8">
            <p className="text-muted-foreground">{HUNGARIAN_LABELS.no_blocked}</p>
          </div> : <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Csapatok</TableHead>
                    <TableHead>Kimenetel</TableHead>
                    <TableHead>Magabiztosság</TableHead>
                    <TableHead>Blokk oka</TableHead>
                    <TableHead>Alternatív</TableHead>
                    <TableHead>Blokkolva</TableHead>
                    <TableHead>Felülvizsgáló</TableHead>
                    <TableHead className="text-right">Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.map((pred: BlockedPrediction) => <TableRow key={pred.id}>
                      <TableCell className="font-medium">
                        <div className="text-sm">
                          {pred.home_team_name} - {pred.away_team_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {pred.predicted_outcome === "home_win" ? "Otthon" : pred.predicted_outcome === "away_win" ? "Vendég" : "Döntetlen"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {pred.confidence_score.toFixed(1)}%
                        </div>
                        {pred.downgraded_from_confidence && <div className="text-xs text-muted-foreground">
                            (volt: {pred.downgraded_from_confidence.toFixed(1)}%)
                          </div>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-xs truncate">
                          {pred.blocked_reason || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {pred.alternate_outcome ? <Badge variant="secondary">
                            {pred.alternate_outcome === "home_win" ? "Otthon" : pred.alternate_outcome === "away_win" ? "Vendég" : "Döntetlen"}
                          </Badge> : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(pred.blocked_at), {
                    addSuffix: true
                  })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {pred.reviewer_email ? <div className="text-xs text-muted-foreground">
                            {pred.reviewer_email}
                          </div> : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="default" onClick={() => handleReviewAction(pred.id, "accepted")} disabled={reviewMutation.isPending} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {HUNGARIAN_LABELS.accept}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReviewAction(pred.id, "rejected")} disabled={reviewMutation.isPending}>
                            <XCircle className="h-4 w-4 mr-1" />
                            {HUNGARIAN_LABELS.reject}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>

            {pagination && pagination.total > limit && <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Megjelenítés {offset + 1}-{Math.min(offset + limit, pagination.total)} / {pagination.total}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={offset === 0}>
                    Előző
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextPage} disabled={offset + limit >= pagination.total}>
                    Következő
                  </Button>
                </div>
              </div>}
          </>}
      </CardContent>
    </Card>;
}