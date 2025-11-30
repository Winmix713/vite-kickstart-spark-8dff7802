import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Play, Pause, Trash2, Edit, Plus, Settings, Activity, Zap, Shield } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import ModelCard from "@/components/models/ModelCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listModels, registerModel, promoteChallenger, createExperiment, evaluateExperiment, epsilonGreedySelect, updateModel, deleteModel } from "@/integrations/models/service";
import type { ModelExperiment, ModelRegistry } from "@/types/models";
import type { ModelAction } from "@/types/admin";
import { toast } from "sonner";
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
function useExperiments() {
  return useQuery<ModelExperiment[]>({
    queryKey: ["model-experiments"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("model_experiments").select("*").order("started_at", {
        ascending: false
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ModelExperiment[];
    }
  });
}
export default function ModelsPage() {
  useDocumentTitle("Models • WinMix TipsterHub");
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelRegistry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const modelsQuery = useQuery<ModelRegistry[]>({
    queryKey: ["model-registry"],
    queryFn: listModels,
    refetchInterval: 20000
  });
  const experimentsQuery = useExperiments();
  type ModelForm = {
    model_name: string;
    model_version: string;
    model_type: ModelRegistry["model_type"];
    algorithm: string;
    hyperparameters: string;
    champion_id?: string;
    challenger_id?: string;
    experiment_name?: string;
    traffic_allocation?: number;
    description?: string;
    is_active?: boolean;
  };
  const [form, setForm] = useState<ModelForm>({
    model_name: "",
    model_version: "",
    model_type: "challenger",
    algorithm: "",
    hyperparameters: "{}",
    traffic_allocation: 10,
    description: "",
    is_active: true
  });
  const trafficData = useMemo(() => {
    const models = modelsQuery.data ?? [];
    const active = models.filter(m => m.is_active !== false);
    return active.map(m => ({
      name: `${m.model_name} v${m.model_version}`,
      value: m.traffic_allocation ?? 0
    }));
  }, [modelsQuery.data]);
  const filteredModels = useMemo(() => {
    const models = modelsQuery.data ?? [];
    return models.filter(model => {
      const matchesSearch = model.model_name.toLowerCase().includes(searchTerm.toLowerCase()) || model.algorithm?.toLowerCase().includes(searchTerm.toLowerCase()) || model.model_version.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || model.model_type === selectedType;
      const matchesActive = showInactive || model.is_active !== false;
      return matchesSearch && matchesType && matchesActive;
    });
  }, [modelsQuery.data, searchTerm, selectedType, showInactive]);
  const stats = useMemo(() => {
    const models = filteredModels;
    return {
      total: models.length,
      active: models.filter(m => m.is_active !== false).length,
      champions: models.filter(m => m.model_type === "champion").length,
      challengers: models.filter(m => m.model_type === "challenger").length,
      retired: models.filter(m => m.model_type === "retired").length
    };
  }, [filteredModels]);
  const getModelActions = (model: ModelRegistry): ModelAction[] => {
    const actions: ModelAction[] = [];
    if (model.model_type === "challenger") {
      actions.push({
        type: 'promote',
        label: 'Promote to Champion',
        icon: Zap,
        requiresRole: 'admin'
      });
    }
    if (model.is_active === false) {
      actions.push({
        type: 'activate',
        label: 'Activate',
        icon: Play,
        requiresRole: 'admin'
      });
    } else {
      actions.push({
        type: 'deactivate',
        label: 'Deactivate',
        icon: Pause,
        requiresRole: 'admin'
      });
    }
    actions.push({
      type: 'duplicate',
      label: 'Duplicate',
      icon: Settings,
      requiresRole: 'analyst'
    });
    actions.push({
      type: 'retire',
      label: 'Retire',
      icon: Shield,
      requiresRole: 'admin'
    });
    return actions;
  };
  const registerMutation = useMutation({
    mutationFn: async () => {
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(form.hyperparameters || "{}");
      } catch {
        parsed = null;
      }
      return registerModel({
        model_name: form.model_name,
        model_version: form.model_version,
        model_type: form.model_type,
        algorithm: form.algorithm || null,
        hyperparameters: parsed,
        traffic_allocation: form.traffic_allocation || 10,
        description: form.description,
        is_active: form.is_active
      });
    },
    onSuccess: async () => {
      toast.success("Model registered successfully");
      await queryClient.invalidateQueries({
        queryKey: ["model-registry"]
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "Registration error";
      toast.error(message);
    }
  });
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: Partial<ModelForm>;
    }) => {
      let parsed: Record<string, unknown> | null = null;
      if (data.hyperparameters) {
        try {
          parsed = JSON.parse(data.hyperparameters);
        } catch {
          parsed = null;
        }
      }
      return updateModel(id, {
        algorithm: data.algorithm,
        hyperparameters: parsed,
        traffic_allocation: data.traffic_allocation,
        description: data.description,
        is_active: data.is_active
      });
    },
    onSuccess: async () => {
      toast.success("Model updated successfully");
      await queryClient.invalidateQueries({
        queryKey: ["model-registry"]
      });
      setIsEditDialogOpen(false);
      setSelectedModel(null);
      resetForm();
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "Update error";
      toast.error(message);
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteModel,
    onSuccess: async () => {
      toast.success("Model deleted successfully");
      await queryClient.invalidateQueries({
        queryKey: ["model-registry"]
      });
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "Delete error";
      toast.error(message);
    }
  });
  const activateDeactivateMutation = useMutation({
    mutationFn: async ({
      id,
      isActive
    }: {
      id: string;
      isActive: boolean;
    }) => {
      return updateModel(id, {
        is_active: isActive
      });
    },
    onSuccess: async (_, {
      isActive
    }) => {
      toast.success(`Model ${isActive ? 'activated' : 'deactivated'} successfully`);
      await queryClient.invalidateQueries({
        queryKey: ["model-registry"]
      });
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "Status update error";
      toast.error(message);
    }
  });
  const promoteMutation = useMutation({
    mutationFn: async (model: ModelRegistry) => promoteChallenger(model.id),
    onSuccess: async () => {
      toast.success("Challenger promoted successfully");
      await queryClient.invalidateQueries({
        queryKey: ["model-registry"]
      });
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "Promotion error";
      toast.error(message);
    }
  });
  const createExperimentMutation = useMutation({
    mutationFn: async (payload: {
      championId: string;
      challengerId: string;
      name: string;
    }) => createExperiment({
      experiment_name: payload.name,
      champion_model_id: payload.championId,
      challenger_model_id: payload.challengerId,
      target_sample_size: 100
    }),
    onSuccess: async () => {
      toast.success("Experiment started successfully");
      await queryClient.invalidateQueries({
        queryKey: ["model-experiments"]
      });
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "Experiment creation failed";
      toast.error(message);
    }
  });
  const evaluateMutation = useMutation({
    mutationFn: async (experimentId: string) => evaluateExperiment(experimentId),
    onSuccess: async () => {
      toast.success("Experiment evaluated successfully");
      await queryClient.invalidateQueries({
        queryKey: ["model-experiments"]
      });
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "Evaluation error";
      toast.error(message);
    }
  });
  const testSelection = async () => {
    const result = await epsilonGreedySelect(0.1);
    toast.success(`Selected model: ${result.selectedModelId} (${result.strategy})`);
  };
  const resetForm = () => {
    setForm({
      model_name: "",
      model_version: "",
      model_type: "challenger",
      algorithm: "",
      hyperparameters: "{}",
      traffic_allocation: 10,
      description: "",
      is_active: true
    });
  };
  const handleEdit = (model: ModelRegistry) => {
    setSelectedModel(model);
    setForm({
      model_name: model.model_name,
      model_version: model.model_version,
      model_type: model.model_type,
      algorithm: model.algorithm || "",
      hyperparameters: JSON.stringify(model.hyperparameters || {}),
      traffic_allocation: model.traffic_allocation || 10,
      description: model.description || "",
      is_active: model.is_active !== false
    });
    setIsEditDialogOpen(true);
  };
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this model?")) {
      deleteMutation.mutate(id);
    }
  };
  const handleModelAction = (action: ModelAction, model: ModelRegistry) => {
    switch (action.type) {
      case 'activate':
        activateDeactivateMutation.mutate({
          id: model.id,
          isActive: true
        });
        break;
      case 'deactivate':
        activateDeactivateMutation.mutate({
          id: model.id,
          isActive: false
        });
        break;
      case 'promote':
        promoteMutation.mutate(model);
        break;
      case 'retire':
        updateMutation.mutate({
          id: model.id,
          data: {
            model_type: 'retired',
            is_active: false
          }
        });
        break;
      case 'duplicate':
        {
          // Create a duplicated model with same hyperparameters but new ID
          const duplicatedModel = {
            model_name: `${model.model_name}_copy_${Date.now().slice(-4)}`,
            model_version: `${model.model_version}_copy`,
            model_type: "challenger" as const,
            algorithm: model.algorithm || "",
            hyperparameters: JSON.stringify(model.hyperparameters || {}),
            traffic_allocation: model.traffic_allocation || 10,
            description: `${model.description || ''} (Copy of ${model.model_name} v${model.model_version})`,
            is_active: false
          };
          createMutation.mutate(duplicatedModel, {
            onSuccess: () => {
              toast.success("Model duplicated successfully");
            },
            onError: (e: unknown) => {
              const message = e instanceof Error ? e.message : "Duplication failed";
              toast.error(message);
            }
          });
          break;
        }
    }
  };
  const models = filteredModels;
  const champion = models.find(m => m.model_type === "champion") || null;
  const challengers = models.filter(m => m.model_type === "challenger");
  const retired = models.filter(m => m.model_type === "retired");
  const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444", "#14b8a6"];
  return <AuthGate allowedRoles={['admin', 'analyst']}>
      <PageLayout>
        <PageHeader title="Model Management" description="AI models with champion/challenger framework and A/B testing" actions={<>
              <Button variant="outline" onClick={testSelection}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Test Selection
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Model
              </Button>
            </>} />

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register New Model</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model-name">Model Name</Label>
                  <Input value={form.model_name} onChange={e => setForm(f => ({
                  ...f,
                  model_name: e.target.value
                }))} placeholder="HeuristicEngine" />
                </div>
                <div>
                  <Label htmlFor="model-version">Version</Label>
                  <Input value={form.model_version} onChange={e => setForm(f => ({
                  ...f,
                  model_version: e.target.value
                }))} placeholder="1.0.0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model-type">Type</Label>
                  <Select value={form.model_type} onValueChange={v => setForm(f => ({
                  ...f,
                  model_type: v as ModelRegistry["model_type"]
                }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="champion">Champion</SelectItem>
                      <SelectItem value="challenger">Challenger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="traffic-allocation">Traffic Allocation (%)</Label>
                  <Input type="number" min="0" max="100" value={form.traffic_allocation} onChange={e => setForm(f => ({
                  ...f,
                  traffic_allocation: parseInt(e.target.value) || 10
                }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="algorithm">Algorithm</Label>
                <Input value={form.algorithm} onChange={e => setForm(f => ({
                ...f,
                algorithm: e.target.value
              }))} placeholder="GradientBoostedHeuristics" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({
                ...f,
                description: e.target.value
              }))} placeholder="Model description and purpose..." />
              </div>
              <div>
                <Label htmlFor="hyperparameters">Hyperparameters (JSON)</Label>
                <Textarea value={form.hyperparameters} onChange={e => setForm(f => ({
                ...f,
                hyperparameters: e.target.value
              }))} placeholder='{"learning_rate": 0.1}' rows={4} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is-active" checked={form.is_active} onCheckedChange={checked => setForm(f => ({
                ...f,
                is_active: checked
              }))} />
                <Label htmlFor="is-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending || !form.model_name || !form.model_version}>
                Register
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

            {modelsQuery.error && <Alert variant="destructive" className="mb-6">
                <AlertDescription>{(modelsQuery.error as Error).message}</AlertDescription>
              </Alert>}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Models</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats.active}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Champions</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">{stats.champions}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Challengers</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">{stats.challengers}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Retired</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-500">{stats.retired}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-card/60 border-border/80 backdrop-blur mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input placeholder="Search models..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="champion">Champions</SelectItem>
                        <SelectItem value="challenger">Challengers</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
                    <Label htmlFor="show-inactive">Show Inactive</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Active Models */}
                <Card className="bg-card/60 border-border/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Active Models</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {models.length === 0 ? <div className="rounded-lg border border-border/60 bg-muted/20 p-8 text-center text-muted-foreground">
                        No models registered.
                      </div> : <div className="space-y-4">
                        {champion && <ModelCard key={champion.id} model={champion} onPromote={m => promoteMutation.mutate(m)} onEdit={handleEdit} onDelete={handleDelete} onAction={(action, model) => handleModelAction(action, model)} actions={getModelActions(champion)} />}
                        {challengers.map(m => <ModelCard key={m.id} model={m} onPromote={mod => promoteMutation.mutate(mod)} onEdit={handleEdit} onDelete={handleDelete} onAction={(action, model) => handleModelAction(action, model)} actions={getModelActions(m)} />)}
                      </div>}
                  </CardContent>
                </Card>

                {/* Experiments */}
                <Card className="bg-card/60 border-border/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Running Experiments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {experimentsQuery.data?.length ? <div className="space-y-3">
                        {experimentsQuery.data.map(e => <div key={e.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-4">
                            <div>
                              <div className="font-medium text-foreground">{e.experiment_name}</div>
                              <div className="text-xs text-muted-foreground">
                                Sample: {e.current_sample_size ?? 0} / Target: {e.target_sample_size ?? 0} • 
                                P-value: {e.p_value?.toFixed(4) ?? "-"} • 
                                Decision: {e.decision ?? "-"}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => evaluateMutation.mutate(e.id)}>
                                Evaluate
                              </Button>
                            </div>
                          </div>)}
                      </div> : <div className="rounded-lg border border-border/60 bg-muted/20 p-8 text-center text-muted-foreground">
                        No running experiments.
                      </div>}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Traffic Distribution */}
                <Card className="bg-card/60 border-border/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Traffic Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie dataKey="value" data={trafficData} outerRadius={90} label>
                            {trafficData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-card/60 border-border/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline" onClick={testSelection}>
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Test Model Selection
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Register New Model
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            </div>
      </PageLayout>
    </AuthGate>;
}