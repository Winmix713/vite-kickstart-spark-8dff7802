// Phase 9: Self-Improving System Components

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Rocket, TestTube, TrendingUp, Settings, Play, Pause, CheckCircle, XCircle, Clock, BarChart3, Zap, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SelfImprovingSystemService } from '@/lib/phase9-api';
import { supabase } from '@/integrations/supabase/client';
import type { FeatureExperiment, ExperimentDashboardProps, FeatureGenerationRequest, ContinuousLearningResponse } from '@/types/phase9';

// Experiment Dashboard Component
export const ExperimentDashboard: React.FC<ExperimentDashboardProps> = ({
  showActiveOnly = false,
  autoRefresh = true
}) => {
  const [experiments, setExperiments] = useState<FeatureExperiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunningLearning, setIsRunningLearning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const fetchExperiments = useCallback(async () => {
    try {
      setError(null);
      let query = supabase.from('feature_experiments').select('*');
      if (showActiveOnly) {
        query = query.eq('is_active', true);
      }
      const {
        data,
        error: fetchError
      } = await query.order('created_at', {
        ascending: false
      }).limit(50);
      if (fetchError) throw fetchError;
      setExperiments(data as FeatureExperiment[]);
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch experiments';
      setError(errorMessage);
      toast({
        title: 'Error fetching experiments',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [showActiveOnly]);
  const handleGenerateFeatures = async () => {
    setIsGenerating(true);
    try {
      const request: FeatureGenerationRequest = {
        feature_types: ['polynomial', 'interaction', 'ratio'],
        base_features: ['home_form', 'away_form', 'h2h_record', 'league_avg_goals', 'recent_scoring'],
        sample_size: 2000,
        test_duration_days: 14
      };
      const result = await SelfImprovingSystemService.generateNewFeatures(request);
      if (result.success) {
        toast({
          title: 'Features generated successfully',
          description: `Generated ${result.experiments?.length || 0} new feature experiments`
        });
        await fetchExperiments();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate features';
      toast({
        title: 'Error generating features',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  const handleRunContinuousLearning = async () => {
    setIsRunningLearning(true);
    try {
      const result = await SelfImprovingSystemService.runContinuousLearning();
      if (result.success && result.results) {
        const {
          experimentsGenerated,
          experimentsCompleted,
          featuresApproved,
          modelAccuracyImprovement
        } = result.results;
        toast({
          title: 'Continuous learning completed',
          description: `Generated: ${experimentsGenerated}, Completed: ${experimentsCompleted}, Approved: ${featuresApproved}, Improvement: +${modelAccuracyImprovement.toFixed(1)}%`
        });
        await fetchExperiments();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run continuous learning';
      toast({
        title: 'Error running continuous learning',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsRunningLearning(false);
    }
  };
  const handleTestFeature = async (experimentId: string) => {
    try {
      const result = await SelfImprovingSystemService.testFeature(experimentId);
      if (result.success) {
        toast({
          title: 'Feature test completed',
          description: `Recommendation: ${result.result?.recommendation}`
        });
        await fetchExperiments();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test feature';
      toast({
        title: 'Error testing feature',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };
  useEffect(() => {
    fetchExperiments();
    if (autoRefresh) {
      const interval = setInterval(fetchExperiments, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [showActiveOnly, autoRefresh, fetchExperiments]);
  const getExperimentStats = () => {
    const total = experiments.length;
    const active = experiments.filter(e => e.is_active).length;
    const completed = experiments.filter(e => !e.is_active).length;
    const approved = experiments.filter(e => e.is_approved).length;
    const significant = experiments.filter(e => e.statistical_significance).length;
    return {
      total,
      active,
      completed,
      approved,
      significant
    };
  };
  const getStatusIcon = (experiment: FeatureExperiment) => {
    if (experiment.is_approved) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (experiment.is_active) return <Clock className="h-4 w-4 text-blue-500" />;
    if (experiment.statistical_significance) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };
  const getStatusBadge = (experiment: FeatureExperiment) => {
    if (experiment.is_approved) return <Badge className="bg-green-100 text-green-800">APPROVED</Badge>;
    if (experiment.is_active) return <Badge className="bg-blue-100 text-blue-800">ACTIVE</Badge>;
    if (experiment.statistical_significance) return <Badge className="bg-green-100 text-green-800">SIGNIFICANT</Badge>;
    return <Badge variant="secondary">COMPLETED</Badge>;
  };
  const getFeatureTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'polynomial': 'bg-purple-100 text-purple-800',
      'interaction': 'bg-blue-100 text-blue-800',
      'ratio': 'bg-green-100 text-green-800',
      'temporal': 'bg-orange-100 text-orange-800',
      'aggregate': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };
  const stats = getExperimentStats();
  if (isLoading) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Feature Experiment Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Feature Experiment Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Experiment Statistics
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleGenerateFeatures} disabled={isGenerating} variant="outline" size="sm">
                {isGenerating ? <>
                    <Clock className="mr-2 h-4 w-4 animate-pulse" />
                    Generating...
                  </> : <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Features
                  </>}
              </Button>
              <Button onClick={handleRunContinuousLearning} disabled={isRunningLearning} size="sm">
                {isRunningLearning ? <>
                    <Clock className="mr-2 h-4 w-4 animate-pulse" />
                    Learning...
                  </> : <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Learning
                  </>}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.significant}</div>
              <div className="text-sm text-gray-600">Significant</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experiments List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Feature Experiments
            </CardTitle>
            {lastRefresh && <span className="text-xs text-gray-500">
                Updated: {lastRefresh.toLocaleTimeString()}
              </span>}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="significant">Significant ({stats.significant})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <ExperimentList experiments={experiments} onTestFeature={handleTestFeature} getStatusIcon={getStatusIcon} getStatusBadge={getStatusBadge} getFeatureTypeColor={getFeatureTypeColor} />
            </TabsContent>
            
            <TabsContent value="active" className="space-y-4">
              <ExperimentList experiments={experiments.filter(e => e.is_active)} onTestFeature={handleTestFeature} getStatusIcon={getStatusIcon} getStatusBadge={getStatusBadge} getFeatureTypeColor={getFeatureTypeColor} />
            </TabsContent>
            
            <TabsContent value="approved" className="space-y-4">
              <ExperimentList experiments={experiments.filter(e => e.is_approved)} onTestFeature={handleTestFeature} getStatusIcon={getStatusIcon} getStatusBadge={getStatusBadge} getFeatureTypeColor={getFeatureTypeColor} />
            </TabsContent>
            
            <TabsContent value="significant" className="space-y-4">
              <ExperimentList experiments={experiments.filter(e => e.statistical_significance)} onTestFeature={handleTestFeature} getStatusIcon={getStatusIcon} getStatusBadge={getStatusBadge} getFeatureTypeColor={getFeatureTypeColor} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};

// Experiment List Component
interface ExperimentListProps {
  experiments: FeatureExperiment[];
  onTestFeature: (experimentId: string) => void;
  getStatusIcon: (experiment: FeatureExperiment) => React.ReactNode;
  getStatusBadge: (experiment: FeatureExperiment) => React.ReactNode;
  getFeatureTypeColor: (type: string) => string;
}
const ExperimentList: React.FC<ExperimentListProps> = ({
  experiments,
  onTestFeature,
  getStatusIcon,
  getStatusBadge,
  getFeatureTypeColor
}) => {
  if (experiments.length === 0) {
    return <div className="text-center py-8 text-gray-500">
        <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No experiments found in this category.</p>
      </div>;
  }
  return <div className="space-y-4">
      {experiments.map(experiment => <div key={experiment.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(experiment)}
              <div>
                <h4 className="font-semibold">{experiment.experiment_name}</h4>
                <p className="text-sm text-gray-600">{experiment.feature_expression}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getFeatureTypeColor(experiment.feature_type)}>
                {experiment.feature_type.toUpperCase()}
              </Badge>
              {getStatusBadge(experiment)}
            </div>
          </div>

          {experiment.is_active && <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-sm text-gray-600">
                Started: {new Date(experiment.test_start_date).toLocaleDateString()}
              </div>
              <Button onClick={() => onTestFeature(experiment.id)} size="sm" variant="outline">
                <TestTube className="mr-2 h-4 w-4" />
                Test Feature
              </Button>
            </div>}

          {!experiment.is_active && experiment.improvement_delta !== null && <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t text-sm">
              <div>
                <span className="text-gray-600">Control:</span>
                <div className="font-semibold">{experiment.control_accuracy?.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-gray-600">Test:</span>
                <div className="font-semibold">{experiment.test_accuracy?.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-gray-600">Improvement:</span>
                <div className={`font-semibold ${(experiment.improvement_delta ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(experiment.improvement_delta ?? 0) > 0 ? '+' : ''}{experiment.improvement_delta?.toFixed(2)}%
                </div>
              </div>
              <div>
                <span className="text-gray-600">P-value:</span>
                <div className="font-semibold">{experiment.p_value?.toFixed(4)}</div>
              </div>
            </div>}
        </div>)}
    </div>;
};

// Feature Generation Wizard Component
interface FeatureGenerationWizardProps {
  onGenerationComplete?: () => void;
}
export const FeatureGenerationWizard: React.FC<FeatureGenerationWizardProps> = ({
  onGenerationComplete
}) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<FeatureGenerationRequest>({
    feature_types: ['polynomial', 'interaction', 'ratio'],
    base_features: ['home_form', 'away_form', 'h2h_record'],
    sample_size: 1000,
    test_duration_days: 14
  });
  const availableFeatures = ['home_form', 'away_form', 'h2h_record', 'league_avg_goals', 'recent_scoring', 'defensive_strength', 'attacking_strength', 'home_advantage', 'travel_distance', 'weather_impact', 'injury_factor', 'motivation_level'];
  const featureTypes = [{
    value: 'polynomial',
    label: 'Polynomial Features',
    description: 'x², x³, etc.'
  }, {
    value: 'interaction',
    label: 'Interaction Features',
    description: 'x₁ × x₂'
  }, {
    value: 'ratio',
    label: 'Ratio Features',
    description: 'x₁ / x₂'
  }, {
    value: 'temporal',
    label: 'Temporal Features',
    description: 'Time-based patterns'
  }, {
    value: 'aggregate',
    label: 'Aggregate Features',
    description: 'Rolling averages'
  }];
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await SelfImprovingSystemService.generateNewFeatures(config);
      if (result.success) {
        toast({
          title: 'Feature generation completed',
          description: `Generated ${result.experiments?.length || 0} new experiments`
        });
        onGenerationComplete?.();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate features';
      toast({
        title: 'Error generating features',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  const toggleFeatureType = (type: string) => {
    setConfig(prev => ({
      ...prev,
      feature_types: prev.feature_types.includes(type as 'polynomial' | 'interaction' | 'ratio' | 'temporal' | 'aggregate') ? prev.feature_types.filter(t => t !== type) : [...prev.feature_types, type as 'polynomial' | 'interaction' | 'ratio' | 'temporal' | 'aggregate']
    }));
  };
  const toggleBaseFeature = (feature: string) => {
    setConfig(prev => ({
      ...prev,
      base_features: prev.base_features.includes(feature) ? prev.base_features.filter(f => f !== feature) : [...prev.base_features, feature]
    }));
  };
  return <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Feature Generation Wizard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={step / 3 * 100} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Feature Types</span>
            <span>Base Features</span>
            <span>Configuration</span>
          </div>
        </div>

        {step === 1 && <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Feature Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureTypes.map(type => <div key={type.value} className={`p-4 border rounded-lg cursor-pointer transition-colors ${config.feature_types.includes(type.value as 'polynomial' | 'interaction' | 'ratio' | 'temporal' | 'aggregate') ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => toggleFeatureType(type.value)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{type.label}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${config.feature_types.includes(type.value as 'polynomial' | 'interaction' | 'ratio' | 'temporal' | 'aggregate') ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} />
                  </div>
                </div>)}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={config.feature_types.length === 0}>
                Next
              </Button>
            </div>
          </div>}

        {step === 2 && <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Base Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableFeatures.map(feature => <div key={feature} className={`p-3 border rounded-lg cursor-pointer transition-colors ${config.base_features.includes(feature) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => toggleBaseFeature(feature)}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{feature.replace(/_/g, ' ')}</span>
                    <div className={`w-3 h-3 rounded-full border-2 ${config.base_features.includes(feature) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} />
                  </div>
                </div>)}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Previous
              </Button>
              <Button onClick={() => setStep(3)} disabled={config.base_features.length < 2}>
                Next
              </Button>
            </div>
          </div>}

        {step === 3 && <div className="space-y-6">
            <h3 className="text-lg font-semibold">Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Sample Size</label>
                <input type="number" value={config.sample_size} onChange={e => setConfig(prev => ({
              ...prev,
              sample_size: parseInt(e.target.value) || 1000
            }))} className="w-full px-3 py-2 border rounded-md" min="100" max="10000" step="100" />
                <p className="text-xs text-gray-500 mt-1">Number of samples for testing</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Test Duration (days)</label>
                <input type="number" value={config.test_duration_days} onChange={e => setConfig(prev => ({
              ...prev,
              test_duration_days: parseInt(e.target.value) || 14
            }))} className="w-full px-3 py-2 border rounded-md" min="7" max="90" step="1" />
                <p className="text-xs text-gray-500 mt-1">Duration of A/B test</p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold mb-2">Generation Summary</h4>
              <div className="text-sm space-y-1">
                <p><strong>Feature Types:</strong> {config.feature_types.join(', ')}</p>
                <p><strong>Base Features:</strong> {config.base_features.join(', ')}</p>
                <p><strong>Estimated Experiments:</strong> {config.feature_types.length * config.base_features.length}</p>
                <p><strong>Sample Size:</strong> {config.sample_size}</p>
                <p><strong>Test Duration:</strong> {config.test_duration_days} days</p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Previous
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <>
                    <Clock className="mr-2 h-4 w-4 animate-pulse" />
                    Generating...
                  </> : <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Generate Features
                  </>}
              </Button>
            </div>
          </div>}
      </CardContent>
    </Card>;
};