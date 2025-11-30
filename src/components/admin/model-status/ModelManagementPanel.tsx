import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Trophy, Archive, Loader2 } from "lucide-react";
import type { ModelRegistryItem } from "@/types/admin-model-status";
import { formatDistanceToNow } from "date-fns";
interface ModelManagementPanelProps {
  models: ModelRegistryItem[];
  activeModel: ModelRegistryItem | null;
  onPromoteModel: (modelId: string) => Promise<void>;
  onTriggerTraining: () => Promise<void>;
  isPromoting: boolean;
  isTraining: boolean;
}
export function ModelManagementPanel({
  models,
  activeModel,
  onPromoteModel,
  onTriggerTraining,
  isPromoting,
  isTraining
}: ModelManagementPanelProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>(activeModel?.id || "");
  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case "champion":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "challenger":
        return <Award className="h-4 w-4 text-blue-500" />;
      case "retired":
        return <Archive className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };
  const getModelTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      champion: "default",
      challenger: "secondary",
      retired: "outline"
    };
    return <Badge variant={variants[type] || "default"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>;
  };
  const handlePromote = async () => {
    if (selectedModelId && selectedModelId !== activeModel?.id) {
      await onPromoteModel(selectedModelId);
    }
  };
  return <div className="space-y-6">
      {/* Active Model Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Active Model
          </CardTitle>
          <CardDescription>
            Currently serving predictions in production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedModelId} onValueChange={setSelectedModelId} disabled={isPromoting}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map(model => <SelectItem key={model.id} value={model.id}>
                    {model.model_name} ({model.model_version})
                    {model.id === activeModel?.id && " - Current"}
                  </SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handlePromote} disabled={isPromoting || !selectedModelId || selectedModelId === activeModel?.id}>
              {isPromoting ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Promoting...
                </> : "Promote Model"}
            </Button>
          </div>
          {activeModel && <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Model Name</p>
                  <p className="text-sm text-muted-foreground">
                    {activeModel.model_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Version</p>
                  <p className="text-sm text-muted-foreground">
                    {activeModel.model_version}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Accuracy</p>
                  <p className="text-sm text-muted-foreground">
                    {activeModel.accuracy?.toFixed(2) || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Predictions</p>
                  <p className="text-sm text-muted-foreground">
                    {activeModel.total_predictions || 0}
                  </p>
                </div>
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* Registry View */}
      <Card>
        <CardHeader>
          <CardTitle>Model Registry</CardTitle>
          <CardDescription>
            All registered models and their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Predictions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map(model => <TableRow key={model.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getModelTypeIcon(model.model_type)}
                      {getModelTypeBadge(model.model_type)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{model.model_name}</TableCell>
                  <TableCell>{model.model_version}</TableCell>
                  <TableCell>{model.accuracy?.toFixed(2) || 0}%</TableCell>
                  <TableCell>{model.total_predictions || 0}</TableCell>
                  <TableCell>
                    {model.registered_at ? formatDistanceToNow(new Date(model.registered_at), {
                  addSuffix: true
                }) : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={model.is_active ? "default" : "outline"}>
                      {model.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Training Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Training Interface</CardTitle>
          <CardDescription>
            Trigger model retraining with latest data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onTriggerTraining} disabled={isTraining} size="lg">
            {isTraining ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Training in Progress...
              </> : "Retrain Model"}
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            This will create a new candidate model based on the latest match data.
            Training typically takes 5-10 minutes.
          </p>
        </CardContent>
      </Card>
    </div>;
}