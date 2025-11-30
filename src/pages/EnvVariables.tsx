import React, { useMemo, useState, createElement } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Download, Upload, Eye, EyeOff, Edit, Trash2, Shield, Key, Database, Mail, Settings, AlertTriangle, BoxIcon } from 'lucide-react';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/TopBar';
import AuthGate from '@/components/AuthGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EnvironmentVariable, EnvironmentVariableFormData, EnvImportResult, EnvironmentCategory } from '@/types/admin';
const CATEGORIES: Array<{
  value: EnvironmentCategory;
  label: string;
  icon: BoxIcon;
}> = [{
  value: 'general',
  label: 'General',
  icon: Settings
}, {
  value: 'database',
  label: 'Database',
  icon: Database
}, {
  value: 'api',
  label: 'API',
  icon: Key
}, {
  value: 'email',
  label: 'Email',
  icon: Mail
}, {
  value: 'security',
  label: 'Security',
  icon: Shield
}, {
  value: 'cache',
  label: 'Cache',
  icon: Database
}, {
  value: 'ai',
  label: 'AI/ML',
  icon: Settings
}, {
  value: 'logging',
  label: 'Logging',
  icon: Settings
}, {
  value: 'limits',
  label: 'Limits',
  icon: AlertTriangle
}];
const fetchEnvironmentVariables = async (): Promise<EnvironmentVariable[]> => {
  const {
    data,
    error
  } = await supabase.from('environment_variables').select('*').order('category', {
    ascending: true
  }).order('key', {
    ascending: true
  });
  if (error) throw new Error(error.message);
  return data || [];
};
const createEnvironmentVariable = async (data: EnvironmentVariableFormData): Promise<EnvironmentVariable> => {
  const {
    data: result,
    error
  } = await supabase.from('environment_variables').insert(data).select().single();
  if (error) throw new Error(error.message);
  return result;
};
const updateEnvironmentVariable = async (id: string, data: Partial<EnvironmentVariableFormData>): Promise<EnvironmentVariable> => {
  const {
    data: result,
    error
  } = await supabase.from('environment_variables').update(data).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return result;
};
const deleteEnvironmentVariable = async (id: string): Promise<void> => {
  const {
    error
  } = await supabase.from('environment_variables').delete().eq('id', id);
  if (error) throw new Error(error.message);
};
const importFromEnvFile = async (envContent: string): Promise<EnvImportResult> => {
  const {
    data,
    error
  } = await supabase.functions.invoke<EnvImportResult>('admin-import-env', {
    body: {
      content: envContent
    }
  });
  if (error) throw new Error(error.message);
  return data || {
    imported: 0,
    skipped: 0,
    errors: []
  };
};
export default function EnvVariablesPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<EnvironmentVariable | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [envFileContent, setEnvFileContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const variablesQuery = useQuery({
    queryKey: ['environment-variables'],
    queryFn: fetchEnvironmentVariables
  });
  const createMutation = useMutation({
    mutationFn: createEnvironmentVariable,
    onSuccess: () => {
      toast.success('Environment variable created successfully');
      queryClient.invalidateQueries({
        queryKey: ['environment-variables']
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string;
      data: Partial<EnvironmentVariableFormData>;
    }) => updateEnvironmentVariable(id, data),
    onSuccess: () => {
      toast.success('Environment variable updated successfully');
      queryClient.invalidateQueries({
        queryKey: ['environment-variables']
      });
      setIsEditDialogOpen(false);
      setSelectedVariable(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteEnvironmentVariable,
    onSuccess: () => {
      toast.success('Environment variable deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['environment-variables']
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const importMutation = useMutation({
    mutationFn: importFromEnvFile,
    onSuccess: result => {
      toast.success(`Imported ${result.imported} variables, skipped ${result.skipped}`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred during import`);
      }
      queryClient.invalidateQueries({
        queryKey: ['environment-variables']
      });
      setIsImportDialogOpen(false);
      setEnvFileContent('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const [formData, setFormData] = useState<EnvironmentVariableFormData>({
    key: '',
    value: '',
    description: '',
    is_secret: false,
    category: 'general'
  });
  const resetForm = () => {
    setFormData({
      key: '',
      value: '',
      description: '',
      is_secret: false,
      category: 'general'
    });
  };
  const handleEdit = (variable: EnvironmentVariable) => {
    setSelectedVariable(variable);
    setFormData({
      key: variable.key,
      value: variable.value,
      description: variable.description || '',
      is_secret: variable.is_secret,
      category: variable.category as EnvironmentCategory
    });
    setIsEditDialogOpen(true);
  };
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this environment variable?')) {
      deleteMutation.mutate(id);
    }
  };
  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  const exportToEnv = () => {
    const variables = variablesQuery.data || [];
    const envContent = variables.map(v => `# ${v.description || ''}\n${v.key}=${v.value}`).join('\n\n');
    const blob = new Blob([envContent], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
  };
  const filteredVariables = useMemo(() => {
    const variables = variablesQuery.data || [];
    return variables.filter(variable => {
      const matchesSearch = variable.key.toLowerCase().includes(searchTerm.toLowerCase()) || variable.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || variable.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [variablesQuery.data, searchTerm, selectedCategory]);
  const variablesByCategory = useMemo(() => {
    const grouped: Record<string, EnvironmentVariable[]> = {};
    filteredVariables.forEach(variable => {
      if (!grouped[variable.category]) {
        grouped[variable.category] = [];
      }
      grouped[variable.category].push(variable);
    });
    return grouped;
  }, [filteredVariables]);
  const stats = useMemo(() => {
    const variables = variablesQuery.data || [];
    return {
      total: variables.length,
      secrets: variables.filter(v => v.is_secret).length,
      categories: [...new Set(variables.map(v => v.category))].length
    };
  }, [variablesQuery.data]);
  return <AuthGate allowedRoles={['admin']}>
      <div className="min-h-screen bg-black">
        <Sidebar />
        <TopBar />
        <main className="lg:ml-64 pt-16 lg:pt-0">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gradient-emerald">
                  Environment Variables
                </h1>
                <p className="text-muted-foreground">
                  Manage application configuration and secrets
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToEnv}>
                  <Download className="w-4 h-4 mr-2" />
                  Export .env
                </Button>
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Import .env
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Import from .env file</DialogTitle>
                      <DialogDescription>
                        Paste the content of your .env file to import
                        environment variables.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="env-content">.env Content</Label>
                        <Textarea id="env-content" placeholder="API_KEY=your_api_key&#10;DATABASE_URL=postgresql://...&#10;DEBUG=true" value={envFileContent} onChange={e => setEnvFileContent(e.target.value)} rows={10} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => importMutation.mutate(envFileContent)} disabled={importMutation.isPending || !envFileContent.trim()}>
                        Import
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Variable
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Environment Variable</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="key">Key</Label>
                        <Input id="key" value={formData.key} onChange={e => setFormData(prev => ({
                        ...prev,
                        key: e.target.value
                      }))} placeholder="API_KEY" />
                      </div>
                      <div>
                        <Label htmlFor="value">Value</Label>
                        <Input id="value" type={formData.is_secret && !showSecrets.new ? 'password' : 'text'} value={formData.value} onChange={e => setFormData(prev => ({
                        ...prev,
                        value: e.target.value
                      }))} placeholder="your_api_key" />
                        {formData.is_secret && <Button type="button" variant="ghost" size="sm" onClick={() => toggleSecretVisibility('new')} className="mt-1">
                            {showSecrets.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>}
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" value={formData.description} onChange={e => setFormData(prev => ({
                        ...prev,
                        description: e.target.value
                      }))} placeholder="API key for external service" />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={value => setFormData(prev => ({
                        ...prev,
                        category: value as EnvironmentCategory
                      }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>
                                <div className="flex items-center gap-2">
                                  <cat.icon className="w-4 h-4" />
                                  {cat.label}
                                </div>
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="is_secret" checked={formData.is_secret} onCheckedChange={checked => setFormData(prev => ({
                        ...prev,
                        is_secret: checked
                      }))} />
                        <Label htmlFor="is_secret">
                          This is a secret value
                        </Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending || !formData.key || !formData.value}>
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Variables
                  </CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Secret Variables
                  </CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.secrets}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Categories
                  </CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.categories}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-card/60 border-border/80 backdrop-blur mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input placeholder="Search variables..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <cat.icon className="w-4 h-4" />
                              {cat.label}
                            </div>
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variables List */}
            <div className="space-y-6">
              {Object.entries(variablesByCategory).map(([category, variables]) => {
              const categoryInfo = CATEGORIES.find(c => c.value === category);
              const Icon = categoryInfo?.icon || Settings;
              return <Card key={category} className="bg-card/60 border-border/80 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          {categoryInfo?.label || category}
                          <Badge variant="secondary">{variables.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Key</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {variables.map(variable => <TableRow key={variable.id}>
                                <TableCell className="font-mono text-sm">
                                  {variable.key}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {variable.is_secret && !showSecrets[variable.id] ? <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">
                                        ••••••••
                                      </span>
                                      <Button variant="ghost" size="sm" onClick={() => toggleSecretVisibility(variable.id)}>
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                    </div> : <div className="flex items-center gap-2">
                                      <span className="break-all">
                                        {variable.value}
                                      </span>
                                      {variable.is_secret && <Button variant="ghost" size="sm" onClick={() => toggleSecretVisibility(variable.id)}>
                                          <EyeOff className="w-3 h-3" />
                                        </Button>}
                                    </div>}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {variable.description || '-'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={variable.is_secret ? 'destructive' : 'secondary'}>
                                    {variable.is_secret ? 'Secret' : 'Public'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(variable)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(variable.id)} className="text-destructive hover:text-destructive">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>;
            })}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Environment Variable</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-key">Key</Label>
                    <Input id="edit-key" value={formData.key} onChange={e => setFormData(prev => ({
                    ...prev,
                    key: e.target.value
                  }))} placeholder="API_KEY" />
                  </div>
                  <div>
                    <Label htmlFor="edit-value">Value</Label>
                    <Input id="edit-value" type={formData.is_secret && !showSecrets.edit ? 'password' : 'text'} value={formData.value} onChange={e => setFormData(prev => ({
                    ...prev,
                    value: e.target.value
                  }))} placeholder="your_api_key" />
                    {formData.is_secret && <Button type="button" variant="ghost" size="sm" onClick={() => toggleSecretVisibility('edit')} className="mt-1">
                        {showSecrets.edit ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>}
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Input id="edit-description" value={formData.description} onChange={e => setFormData(prev => ({
                    ...prev,
                    description: e.target.value
                  }))} placeholder="API key for external service" />
                  </div>
                  <div>
                    <Label htmlFor="edit-category">Category</Label>
                    <Select value={formData.category} onValueChange={value => setFormData(prev => ({
                    ...prev,
                    category: value as EnvironmentCategory
                  }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <cat.icon className="w-4 h-4" />
                              {cat.label}
                            </div>
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="edit-is_secret" checked={formData.is_secret} onCheckedChange={checked => setFormData(prev => ({
                    ...prev,
                    is_secret: checked
                  }))} />
                    <Label htmlFor="edit-is_secret">
                      This is a secret value
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => selectedVariable && updateMutation.mutate({
                  id: selectedVariable.id,
                  data: formData
                })} disabled={updateMutation.isPending || !formData.key || !formData.value}>
                    Update
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </AuthGate>;
}