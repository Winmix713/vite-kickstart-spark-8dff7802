import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, RefreshCw, X, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
interface DecayEvent {
  id: string;
  window_start: string;
  window_end: string;
  three_day_accuracy: number;
  seven_day_avg_accuracy: number;
  drop_percentage: number;
  severity: "warning" | "critical" | "severe";
  status: "pending" | "acknowledged" | "auto_retrain_triggered" | "overridden";
  action_taken?: string;
  triggered_at: string;
}
interface MetricBoxProps {
  label: string;
  value: string;
  variant?: "default" | "danger" | "warning";
  trend?: "up" | "down";
}
const MetricBox = ({
  label,
  value,
  variant = "default",
  trend
}: MetricBoxProps) => {
  return <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <p className={cn("text-2xl font-bold", variant === "danger" && "text-red-600", variant === "warning" && "text-orange-500")}>
          {value}
        </p>
        {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
      </div>
    </div>;
};
export const PredictionDecayCard = () => {
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const queryClient = useQueryClient();
  const {
    data: latestEvent,
    isLoading
  } = useQuery({
    queryKey: ["decay-event"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("prediction_decay_events").select("*").eq("status", "pending").order("triggered_at", {
        ascending: false
      }).limit(1).maybeSingle();
      if (error) throw error;
      return data as DecayEvent | null;
    },
    refetchInterval: 60000 // Refetch every minute
  });
  const autoRetrainMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const actionTimestamp = new Date().toISOString();
      const {
        error: updateError
      } = await supabase.from("prediction_decay_events").update({
        status: "auto_retrain_triggered",
        action_taken: `Auto retrain queued at ${actionTimestamp}`,
        resolved_at: actionTimestamp
      }).eq("id", eventId);
      if (updateError) throw updateError;
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('model-auto-retrain', {
          body: {
            decay_event_id: eventId,
            priority: 'high',
            timestamp: actionTimestamp
          }
        });
        if (error) {
          console.warn("Auto-retrain function invocation failed:", error);
        }
      } catch (error) {
        console.warn("Auto-retrain edge function not available:", error);
      }
      return {
        success: true
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["decay-event"]
      });
      toast.success("Model retraining has been initiated", {
        description: "The system will automatically retrain the model with recent data."
      });
    },
    onError: error => {
      toast.error("Failed to trigger auto-retrain", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  const overrideMutation = useMutation({
    mutationFn: async ({
      eventId,
      reason
    }: {
      eventId: string;
      reason: string;
    }) => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      const {
        error
      } = await supabase.from("prediction_decay_events").update({
        status: "overridden",
        override_reason: reason,
        overridden_by: user.id,
        resolved_at: new Date().toISOString()
      }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["decay-event"]
      });
      setShowOverrideDialog(false);
      setOverrideReason("");
      toast.success("Decay alert has been overridden", {
        description: "The alert has been marked as resolved."
      });
    },
    onError: error => {
      toast.error("Failed to override alert", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  const handleAutoRetrain = () => {
    if (latestEvent) {
      autoRetrainMutation.mutate(latestEvent.id);
    }
  };
  const handleOverride = () => {
    if (latestEvent && overrideReason.trim()) {
      overrideMutation.mutate({
        eventId: latestEvent.id,
        reason: overrideReason.trim()
      });
    } else {
      toast.error("Please provide a reason for overriding the alert");
    }
  };
  if (isLoading) {
    return <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>;
  }
  if (!latestEvent) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <AlertTriangle className="h-5 w-5" />
            Model Performance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-lg font-medium text-green-600 mb-2">
              No Decay Alerts
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              Model prediction accuracy is stable. No significant performance
              degradation detected.
            </p>
          </div>
        </CardContent>
      </Card>;
  }
  const severityConfig = {
    severe: {
      color: "border-l-red-600",
      badgeVariant: "destructive" as const,
      bgColor: "bg-red-50"
    },
    critical: {
      color: "border-l-orange-500",
      badgeVariant: "default" as const,
      bgColor: "bg-orange-50"
    },
    warning: {
      color: "border-l-yellow-500",
      badgeVariant: "secondary" as const,
      bgColor: "bg-yellow-50"
    }
  };
  const config = severityConfig[latestEvent.severity];
  return <>
      <Card className={cn("border-l-4", config.color)}>
        <CardHeader className={config.bgColor}>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Prediction Decay Detected
            <Badge variant={config.badgeVariant}>
              {latestEvent.severity.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4">
              <MetricBox label="7-Day Average" value={`${latestEvent.seven_day_avg_accuracy.toFixed(1)}%`} />
              <MetricBox label="3-Day Recent" value={`${latestEvent.three_day_accuracy.toFixed(1)}%`} trend="down" variant="warning" />
              <MetricBox label="Performance Drop" value={`${latestEvent.drop_percentage.toFixed(1)}%`} variant="danger" />
            </div>

            {/* Alert Info */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Alert Details</p>
              <p className="text-sm text-muted-foreground">
                Period: {new Date(latestEvent.window_start).toLocaleDateString()}{" "}
                - {new Date(latestEvent.window_end).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Triggered:{" "}
                {new Date(latestEvent.triggered_at).toLocaleString()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleAutoRetrain} disabled={autoRetrainMutation.isPending} className="flex-1">
                {autoRetrainMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Auto Retrain
              </Button>
              <Button onClick={() => setShowOverrideDialog(true)} variant="outline" className="flex-1" disabled={overrideMutation.isPending}>
                <X className="mr-2 h-4 w-4" />
                Override Alert
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Decay Alert</DialogTitle>
            <DialogDescription>
              Provide a reason for dismissing this accuracy drop without
              retraining. This will mark the alert as resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea placeholder="e.g., Seasonal anomaly, data quality issue, expected variance due to league break..." value={overrideReason} onChange={e => setOverrideReason(e.target.value)} rows={4} className="resize-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setShowOverrideDialog(false);
            setOverrideReason("");
          }} disabled={overrideMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleOverride} disabled={!overrideReason.trim() || overrideMutation.isPending}>
              {overrideMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
};