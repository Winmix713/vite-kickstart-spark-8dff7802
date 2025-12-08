import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, Play, Pause, Trash2, Edit, Plus, Settings, Activity, Zap, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import classNames from 'classnames';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';
import Popup from '@components/Popup';

// Hooks
import { useDocumentTitle } from '@hooks/useDocumentTitle';

// Services
import { 
  listModels, 
  registerModel, 
  promoteChallenger, 
  createExperiment, 
  evaluateExperiment, 
  epsilonGreedySelect, 
  updateModel, 
  deleteModel 
} from '@/integrations/models/service';

// Utilities
import { supabase } from '@/integrations/supabase/client';

function useExperiments() {
  return useQuery({
    queryKey: ['model-experiments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_experiments')
        .select('*')
        .order('started_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

const ModelStatsWidget = ({ stats }) => {
  const colors = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];
  
  return (
    <WidgetGroup>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Total Models</span>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Active</span>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-green-500">{stats.active}</div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Champions</span>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-yellow-500">{stats.champions}</div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Challengers</span>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-blue-500">{stats.challengers}</div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Retired</span>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-gray-500">{stats.retired}</div>
        </div>
      </div>
    </WidgetGroup>
  );
};

const ModelListWidget = ({ models, champion, challengers, onEdit, onDelete, onAction, getModelActions, promoteMutation }) => {
  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <h3 className="text-lg font-semibold mb-4">Active Models</h3>
        {models.length === 0 ? (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-8 text-center text-muted-foreground">
            No models registered.
          </div>
        ) : (
          <div className="space-y-4">
            {champion && (
              <div className="border border-border/60 rounded-lg p-4 bg-muted/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{champion.model_name}</span>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-500">Champion</span>
                    <span className="text-xs text-muted-foreground">v{champion.model_version}</span>
                  </div>
                  <span className="text-sm font-medium">{champion.traffic_allocation}% traffic</span>
                </div>
                {champion.description && <p className="text-xs text-muted-foreground mb-3">{champion.description}</p>}
                <div className="flex gap-2">
                  <button onClick={() => onEdit(champion)} className="px-3 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20">
                    <Edit className="w-3 h-3 inline mr-1" />
                    Edit
                  </button>
                  <button onClick={() => onDelete(champion.id)} className="px-3 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20">
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            )}
            {challengers.map((m) => (
              <div key={m.id} className="border border-border/60 rounded-lg p-4 bg-muted/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{m.model_name}</span>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-500">Challenger</span>
                    <span className="text-xs text-muted-foreground">v{m.model_version}</span>
                  </div>
                  <span className="text-sm font-medium">{m.traffic_allocation}% traffic</span>
                </div>
                {m.description && <p className="text-xs text-muted-foreground mb-3">{m.description}</p>}
                <div className="flex gap-2">
                  <button onClick={() => promoteMutation.mutate(m)} className="px-3 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    <Zap className="w-3 h-3 inline mr-1" />
                    Promote
                  </button>
                  <button onClick={() => onEdit(m)} className="px-3 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20">
                    <Edit className="w-3 h-3 inline mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetGroup>
  );
};

const TrafficDistributionWidget = ({ trafficData }) => {
  const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];

  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <h3 className="text-lg font-semibold mb-4">Traffic Distribution</h3>
        <div className="h-64 flex items-center justify-center">
          {trafficData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={trafficData} outerRadius={90} label>
                  {trafficData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm">No traffic data available</p>
          )}
        </div>
      </div>
    </WidgetGroup>
  );
};

const ExperimentsWidget = ({ experimentsData, evaluateMutation }) => {
  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <h3 className="text-lg font-semibold mb-4">Running Experiments</h3>
        {experimentsData?.length ? (
          <div className="space-y-3">
            {experimentsData.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-4">
                <div>
                  <div className="font-medium text-foreground">{e.experiment_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Sample: {e.current_sample_size ?? 0} / Target: {e.target_sample_size ?? 0} • 
                    P-value: {e.p_value?.toFixed(4) ?? '-'} • 
                    Decision: {e.decision ?? '-'}
                  </div>
                </div>
                <button onClick={() => evaluateMutation.mutate(e.id)} className="px-3 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20">
                  Evaluate
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-8 text-center text-muted-foreground">
            No running experiments.
          </div>
        )}
      </div>
    </WidgetGroup>
  );
};

export default function ModelsPage() {
  useDocumentTitle('Models • WinMix TipsterHub');
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  
  const modelsQuery = useQuery({ 
    queryKey: ['model-registry'], 
    queryFn: listModels, 
    refetchInterval: 20000 
  });
  const experimentsQuery = useExperiments();

  const [form, setForm] = useState({
    model_name: '',
    model_version: '',
    model_type: 'challenger',
    algorithm: '',
    hyperparameters: '{}',
    traffic_allocation: 10,
    description: '',
    is_active: true,
  });

  const trafficData = useMemo(() => {
    const models = modelsQuery.data ?? [];
    const active = models.filter((m) => m.is_active !== false);
    return active.map((m) => ({ 
      name: `${m.model_name} v${m.model_version}`, 
      value: m.traffic_allocation ?? 0 
    }));
  }, [modelsQuery.data]);

  const filteredModels = useMemo(() => {
    const models = modelsQuery.data ?? [];
    return models.filter((model) => {
      const matchesSearch = 
        model.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.algorithm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.model_version.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || model.model_type === selectedType;
      const matchesActive = showInactive || model.is_active !== false;
      
      return matchesSearch && matchesType && matchesActive;
    });
  }, [modelsQuery.data, searchTerm, selectedType, showInactive]);

  const stats = useMemo(() => {
    const models = filteredModels;
    return {
      total: models.length,
      active: models.filter(m => m.is_active !== false).length,
      champions: models.filter(m => m.model_type === 'champion').length,
      challengers: models.filter(m => m.model_type === 'challenger').length,
      retired: models.filter(m => m.model_type === 'retired').length,
    };
  }, [filteredModels]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      let parsed = null;
      try { 
        parsed = JSON.parse(form.hyperparameters || '{}'); 
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
        is_active: form.is_active,
      });
    },
    onSuccess: async () => {
      toast.success('Model registered successfully');
      await queryClient.invalidateQueries({ queryKey: ['model-registry'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : 'Registration error';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      let parsed = null;
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
        is_active: data.is_active,
      });
    },
    onSuccess: async () => {
      toast.success('Model updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['model-registry'] });
      setIsEditDialogOpen(false);
      setSelectedModel(null);
      resetForm();
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : 'Update error';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteModel,
    onSuccess: async () => {
      toast.success('Model deleted successfully');
      await queryClient.invalidateQueries({ queryKey: ['model-registry'] });
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : 'Delete error';
      toast.error(message);
    },
  });

  const activateDeactivateMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      return updateModel(id, { is_active: isActive });
    },
    onSuccess: async (_, { isActive }) => {
      toast.success(`Model ${isActive ? 'activated' : 'deactivated'} successfully`);
      await queryClient.invalidateQueries({ queryKey: ['model-registry'] });
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : 'Status update error';
      toast.error(message);
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async (model) => promoteChallenger(model.id),
    onSuccess: async () => {
      toast.success('Challenger promoted successfully');
      await queryClient.invalidateQueries({ queryKey: ['model-registry'] });
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : 'Promotion error';
      toast.error(message);
    },
  });

  const createExperimentMutation = useMutation({
    mutationFn: async (payload) =>
      createExperiment({
        experiment_name: payload.name,
        champion_model_id: payload.championId,
        challenger_model_id: payload.challengerId,
        target_sample_size: 100,
      }),
    onSuccess: async () => {
      toast.success('Experiment started successfully');
      await queryClient.invalidateQueries({ queryKey: ['model-experiments'] });
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : 'Experiment creation failed';
      toast.error(message);
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async (experimentId) => evaluateExperiment(experimentId),
    onSuccess: async () => {
      toast.success('Experiment evaluated successfully');
      await queryClient.invalidateQueries({ queryKey: ['model-experiments'] });
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : 'Evaluation error';
      toast.error(message);
    },
  });

  const testSelection = async () => {
    const result = await epsilonGreedySelect(0.1);
    toast.success(`Selected model: ${result.selectedModelId} (${result.strategy})`);
  };

  const resetForm = () => {
    setForm({
      model_name: '',
      model_version: '',
      model_type: 'challenger',
      algorithm: '',
      hyperparameters: '{}',
      traffic_allocation: 10,
      description: '',
      is_active: true,
    });
  };

  const handleEdit = (model) => {
    setSelectedModel(model);
    setForm({
      model_name: model.model_name,
      model_version: model.model_version,
      model_type: model.model_type,
      algorithm: model.algorithm || '',
      hyperparameters: JSON.stringify(model.hyperparameters || {}),
      traffic_allocation: model.traffic_allocation || 10,
      description: model.description || '',
      is_active: model.is_active !== false,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this model?')) {
      deleteMutation.mutate(id);
    }
  };

  const models = filteredModels;
  const champion = models.find((m) => m.model_type === 'champion') || null;
  const challengers = models.filter((m) => m.model_type === 'challenger');

  const widgets = useMemo(() => ({
    stats: <ModelStatsWidget stats={stats} />,
    models: <ModelListWidget 
      models={models} 
      champion={champion} 
      challengers={challengers}
      onEdit={handleEdit}
      onDelete={handleDelete}
      promoteMutation={promoteMutation}
      getModelActions={() => []}
      onAction={() => {}}
    />,
    traffic: <TrafficDistributionWidget trafficData={trafficData} />,
    experiments: <ExperimentsWidget experimentsData={experimentsQuery.data} evaluateMutation={evaluateMutation} />,
  }), [stats, models, champion, challengers, trafficData, experimentsQuery.data]);

  return (
    <>
      <PageHeader 
        title="Model Management" 
        metaDescription="AI models with champion/challenger framework and A/B testing"
      />
      
      <div className="flex justify-end gap-3 px-6 mb-4">
        <button className="btn btn--outline btn--sm" onClick={testSelection}>
          <RefreshCcw className="w-4 h-4 mr-2 inline" />
          Test Selection
        </button>
        <button className="btn btn--sm" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Add Model
        </button>
      </div>

      <AppGrid id="models_page" widgets={widgets} />

      <Popup open={isCreateDialogOpen || isEditDialogOpen} onClose={() => { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); }}>
        <div className="p-5" style={{ minWidth: '500px' }}>
          <h2 className="text-xl font-bold mb-4">{isEditDialogOpen ? 'Edit Model' : 'Register New Model'}</h2>
          
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Model Name</label>
                <input 
                  className="field w-full" 
                  value={form.model_name} 
                  onChange={(e) => setForm((f) => ({ ...f, model_name: e.target.value }))} 
                  placeholder="HeuristicEngine" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Version</label>
                <input 
                  className="field w-full" 
                  value={form.model_version} 
                  onChange={(e) => setForm((f) => ({ ...f, model_version: e.target.value }))} 
                  placeholder="1.0.0" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select 
                  className="field w-full" 
                  value={form.model_type} 
                  onChange={(e) => setForm((f) => ({ ...f, model_type: e.target.value }))}
                >
                  <option value="champion">Champion</option>
                  <option value="challenger">Challenger</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Traffic Allocation (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  className="field w-full" 
                  value={form.traffic_allocation} 
                  onChange={(e) => setForm((f) => ({ ...f, traffic_allocation: parseInt(e.target.value) || 10 }))} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Algorithm</label>
              <input 
                className="field w-full" 
                value={form.algorithm} 
                onChange={(e) => setForm((f) => ({ ...f, algorithm: e.target.value }))} 
                placeholder="GradientBoostedHeuristics" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea 
                className="field w-full" 
                value={form.description} 
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} 
                placeholder="Model description and purpose..." 
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hyperparameters (JSON)</label>
              <textarea 
                className="field w-full font-mono text-sm" 
                value={form.hyperparameters} 
                onChange={(e) => setForm((f) => ({ ...f, hyperparameters: e.target.value }))} 
                placeholder='{"learning_rate": 0.1}' 
                rows={4} 
              />
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="is-active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <label htmlFor="is-active" className="text-sm font-medium">Active</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button className="btn btn--outline" onClick={() => { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); }}>
              Cancel
            </button>
            <button 
              className="btn" 
              onClick={() => isEditDialogOpen ? updateMutation.mutate({ id: selectedModel?.id, data: form }) : registerMutation.mutate()}
              disabled={registerMutation.isPending || updateMutation.isPending || !form.model_name || !form.model_version}
            >
              {isEditDialogOpen ? 'Update' : 'Register'}
            </button>
          </div>
        </div>
      </Popup>
    </>
  );
}
