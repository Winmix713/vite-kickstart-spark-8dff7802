import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Activity, Database, TrendingUp, Loader2 } from "lucide-react";
import { AnalyticsPanel } from "@/components/admin/model-status/AnalyticsPanel";
import { DataConfigurationPanel } from "@/components/admin/model-status/DataConfigurationPanel";
import { SystemLogTable } from "@/components/admin/model-status/SystemLogTable";
import { ModelStatusCard } from "@/components/admin/model-status/ModelStatusCard";
import { ModelRegistryTable } from "@/components/admin/model-status/ModelRegistryTable";
import { useModelRegistry, MODEL_REGISTRY_QUERY_KEY } from "@/hooks/useModelRegistry";
import { getSystemStatus, getAnalytics, promoteModel, triggerTraining } from "@/integrations/admin-model-status/service";
export default function ModelStatusDashboard() {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [isTraining, setIsTraining] = useState(false);
  const {
    data: systemStatus,
    isLoading: isLoadingSystem,
    error: systemError
  } = useQuery({
    queryKey: ["admin-model-system-status"],
    queryFn: getSystemStatus,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    error: analyticsError
  } = useQuery({
    queryKey: ["admin-model-analytics"],
    queryFn: getAnalytics,
    refetchInterval: 60000 // Refetch every minute
  });
  const {
    data: registryModels = [],
    isLoading: isLoadingRegistry,
    error: registryError
  } = useModelRegistry();
  const sortedRegistryModels = useMemo(() => [...registryModels].sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()), [registryModels]);
  const activeRegistryModel = useMemo(() => sortedRegistryModels.find(model => model.status === "active") ?? null, [sortedRegistryModels]);
  const [promotingModelId, setPromotingModelId] = useState<string | null>(null);
  const isPromoting = promotingModelId !== null;
  const promoteModelMutation = useMutation({
    mutationFn: (modelId: string) => promoteModel({
      modelId
    }),
    onMutate: (modelId: string) => {
      setPromotingModelId(modelId);
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ["admin-model-system-status"]
      });
      queryClient.invalidateQueries({
        queryKey: MODEL_REGISTRY_QUERY_KEY
      });
      toast({
        title: "Model Promoted",
        description: data.message
      });
    },
    onError: error => {
      toast({
        title: "Promotion Failed",
        description: error.message || "Failed to promote model.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setPromotingModelId(null);
    }
  });
  const triggerTrainingMutation = useMutation({
    mutationFn: () => {
      setIsTraining(true);
      return triggerTraining({});
    },
    onSuccess: data => {
      toast({
        title: "Training Started",
        description: `${data.message} - ${data.estimatedTime}`
      });
      // Set a timeout to auto-refresh after estimated time
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["admin-model-system-status"]
        });
        queryClient.invalidateQueries({
          queryKey: MODEL_REGISTRY_QUERY_KEY
        });
        setIsTraining(false);
      }, 10000); // 10 seconds for demo purposes
    },
    onError: error => {
      toast({
        title: "Training Failed",
        description: error.message || "Failed to trigger training.",
        variant: "destructive"
      });
      setIsTraining(false);
    }
  });
  const isLoadingAny = isLoadingSystem || isLoadingAnalytics || isLoadingRegistry;
  const loadError = systemError || analyticsError || registryError;
  if (isLoadingAny) {
    return <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading model dashboard...</p>
          </div>
        </div>
      </div>;
  }
  if (loadError) {
    return <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>
              {loadError.message || "An error occurred"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>;
  }
  return <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ML Model Control Center</h1>
          <p className="text-muted-foreground mt-2">
            Unified dashboard for model management, performance monitoring, and data configuration
          </p>
        </div>
      </div>

      <ModelStatusCard model={activeRegistryModel} isLoading={isLoadingRegistry} isRetraining={isTraining} onTriggerTraining={() => triggerTrainingMutation.mutate()} />

      {/* System Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Current system status and active configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Active Model</p>
              <p className="text-lg font-semibold">
                {systemStatus?.activeModel?.model_name || "No active model"}
              </p>
              <p className="text-xs text-muted-foreground">
                {systemStatus?.activeModel?.model_version || ""}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Models</p>
              <p className="text-lg font-semibold">{systemStatus?.models.length || 0}</p>
              <p className="text-xs text-muted-foreground">
                {systemStatus?.models.filter(m => m.is_active).length || 0} active
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">System Health</p>
              <p className="text-lg font-semibold capitalize">
                {analytics?.systemStatus || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground">
                {analytics?.summary.failRate.toFixed(1)}% fail rate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Logs */}
      <SystemLogTable />

      {/* Main Tabs */}
      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Model Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics & Health
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="mt-6">
          <ModelRegistryTable models={sortedRegistryModels} onPromoteModel={modelId => promoteModelMutation.mutate(modelId)} isPromoting={isPromoting} promotingModelId={promotingModelId} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {analytics && <AnalyticsPanel analytics={analytics} />}
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <DataConfigurationPanel />
        </TabsContent>
      </Tabs>
    </div>;
}