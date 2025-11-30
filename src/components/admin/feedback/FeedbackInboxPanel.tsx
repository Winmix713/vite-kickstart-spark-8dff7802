import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Eye, CheckCircle, XCircle, MoreHorizontal, MessageSquare, Calendar, User } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/admin/useAuditLog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
interface FeedbackWithDetails {
  id: string;
  prediction_id: string;
  user_suggestion: string;
  submitted_by: string | null;
  metadata: Record<string, unknown> | null;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    email: string;
    full_name: string | null;
  } | null;
  predictions?: {
    confidence_score: number;
    predicted_outcome: string;
    actual_outcome: string | null;
    explanation: Record<string, unknown> | null;
    matches?: {
      home_team: {
        name: string;
      } | null;
      away_team: {
        name: string;
      } | null;
      match_date: string;
    } | null;
  } | null;
}
const FeedbackInboxPanel = () => {
  const {
    profile
  } = useAuth();
  const {
    log: logAudit
  } = useAuditLog();
  const queryClient = useQueryClient();
  const [selectedPrediction, setSelectedPrediction] = useState<FeedbackWithDetails | null>(null);
  const [isPredictionDialogOpen, setIsPredictionDialogOpen] = useState(false);
  const {
    data: feedback,
    isLoading,
    error
  } = useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("feedback").select(`
          *,
          user_profiles(email, full_name),
          predictions(
            confidence_score,
            predicted_outcome,
            actual_outcome,
            explanation,
            matches(
              home_team:teams(name),
              away_team:teams(name),
              match_date
            )
          )
        `).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data as FeedbackWithDetails[];
    },
    enabled: !!profile
  });
  const resolveMutation = useMutation({
    mutationFn: async ({
      feedbackId,
      resolved
    }: {
      feedbackId: string;
      resolved: boolean;
    }) => {
      const {
        error
      } = await supabase.from("feedback").update({
        resolved
      }).eq("id", feedbackId);
      if (error) throw error;

      // Log audit action
      await logAudit(resolved ? "feedback_resolved" : "feedback_reopened", {
        feedback_id: feedbackId,
        resolved: resolved,
        admin_email: profile?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "feedback"]
      });
      toast.success(`Feedback ${resolveMutation.variables?.resolved ? "resolved" : "reopened"} successfully`);
    },
    onError: error => {
      toast.error(`Failed to update feedback: ${error.message}`);
    }
  });
  const exportToCSV = async () => {
    if (!feedback || feedback.length === 0) {
      toast.error("No data to export");
      return;
    }
    const csvData = feedback.map(item => ({
      ID: item.id,
      "Prediction ID": item.prediction_id,
      Suggestion: item.user_suggestion,
      Submitter: item.user_profiles?.email || "Unknown",
      "Submitter Name": item.user_profiles?.full_name || "",
      Status: item.resolved ? "Resolved" : "Pending",
      "Submitted At": format(new Date(item.created_at), "yyyy-MM-dd HH:mm:ss"),
      "Updated At": format(new Date(item.updated_at), "yyyy-MM-dd HH:mm:ss"),
      "Match": item.predictions?.matches ? `${item.predictions.matches.home_team?.name} vs ${item.predictions.matches.away_team?.name}` : "Unknown",
      "Predicted Outcome": item.predictions?.predicted_outcome || "",
      "Actual Outcome": item.predictions?.actual_outcome || "",
      "Confidence Score": item.predictions?.confidence_score || ""
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `feedback_export_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Log audit action
    await logAudit("feedback_exported", {
      export_count: feedback.length,
      admin_email: profile?.email
    });
    toast.success("Feedback exported successfully");
  };
  const viewPrediction = async (feedbackItem: FeedbackWithDetails) => {
    setSelectedPrediction(feedbackItem);
    setIsPredictionDialogOpen(true);

    // Log audit action
    await logAudit("feedback_viewed", {
      feedback_id: feedbackItem.id,
      prediction_id: feedbackItem.prediction_id,
      admin_email: profile?.email
    });
  };
  const toggleResolve = (feedbackId: string, currentResolved: boolean) => {
    resolveMutation.mutate({
      feedbackId,
      resolved: !currentResolved
    });
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Inbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-32" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Inbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">Error loading feedback: {error.message}</div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Inbox
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {feedback?.length || 0} total
            </Badge>
            <Badge variant="secondary">
              {feedback?.filter(f => !f.resolved).length || 0} pending
            </Badge>
            <Button onClick={exportToCSV} variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {feedback && feedback.length > 0 ? <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Suggestion</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map(item => <TableRow key={item.id}>
                    <TableCell className="max-w-xs">
                      <div className="truncate font-medium">
                        {item.user_suggestion}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {item.user_profiles?.full_name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.user_profiles?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.predictions?.matches ? <div>
                          <div className="font-medium">
                            {item.predictions.matches.home_team?.name} vs {item.predictions.matches.away_team?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(item.predictions.matches.match_date), "MMM dd, yyyy")}
                          </div>
                        </div> : <span className="text-muted-foreground">Unknown match</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.resolved ? "default" : "secondary"}>
                        {item.resolved ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                        {item.resolved ? "Resolved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(item.created_at), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewPrediction(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Prediction
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleResolve(item.id, item.resolved)}>
                            {item.resolved ? <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Reopen
                              </> : <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Resolved
                              </>}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div> : <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No feedback submissions yet.</p>
          </div>}
      </CardContent>

      {/* Prediction Details Dialog */}
      <Dialog open={isPredictionDialogOpen} onOpenChange={setIsPredictionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prediction Details</DialogTitle>
            <DialogDescription>
              Full details for the prediction associated with this feedback
            </DialogDescription>
          </DialogHeader>
          {selectedPrediction?.predictions && <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Match Information</h4>
                {selectedPrediction.predictions.matches && <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Teams:</span>{" "}
                      {selectedPrediction.predictions.matches.home_team?.name} vs{" "}
                      {selectedPrediction.predictions.matches.away_team?.name}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>{" "}
                      {format(new Date(selectedPrediction.predictions.matches.match_date), "PPP")}
                    </div>
                  </div>}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Prediction</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Predicted Outcome:</span>{" "}
                    {selectedPrediction.predictions.predicted_outcome}
                  </div>
                  <div>
                    <span className="font-medium">Actual Outcome:</span>{" "}
                    {selectedPrediction.predictions.actual_outcome || "Not completed"}
                  </div>
                  <div>
                    <span className="font-medium">Confidence Score:</span>{" "}
                    {(selectedPrediction.predictions.confidence_score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {selectedPrediction.predictions.explanation && <div>
                  <h4 className="font-semibold mb-2">Explanation</h4>
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedPrediction.predictions.explanation, null, 2)}
                    </pre>
                  </div>
                </div>}

              <div>
                <h4 className="font-semibold mb-2">User Feedback</h4>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">{selectedPrediction.user_suggestion}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Submitted by {selectedPrediction.user_profiles?.full_name || "Unknown"} on{" "}
                    {format(new Date(selectedPrediction.created_at), "PPP")}
                  </div>
                </div>
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </Card>;
};
export default FeedbackInboxPanel;