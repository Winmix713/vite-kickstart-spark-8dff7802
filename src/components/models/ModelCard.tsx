import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Edit, Trash2, Zap, Shield, Settings, Copy } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { CopyButton, CopyBadge } from "@/components/common";
import type { ModelRegistry } from "@/types/models";
import type { ModelAction } from "@/types/admin";
import { cn } from "@/lib/utils";
interface Props {
  model: ModelRegistry;
  onPromote?: (model: ModelRegistry) => void;
  onEdit?: (model: ModelRegistry) => void;
  onDelete?: (id: string) => void;
  onAction?: (action: ModelAction, model: ModelRegistry) => void;
  actions?: ModelAction[];
}
function typeBadgeVariant(type: ModelRegistry["model_type"]): string {
  switch (type) {
    case "champion":
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    case "challenger":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}
function formatPct(value?: number | null): string {
  if (value === null || value === undefined) return "-";
  return `${Math.round(value * 100)}%`;
}
function getActionIcon(actionType: ModelAction['type']) {
  switch (actionType) {
    case 'activate':
      return Play;
    case 'deactivate':
      return Pause;
    case 'promote':
      return Zap;
    case 'retire':
      return Shield;
    case 'duplicate':
      return Settings;
    default:
      return Settings;
  }
}
export default function ModelCard({
  model,
  onPromote,
  onEdit,
  onDelete,
  onAction,
  actions = []
}: Props) {
  const canPromote = model.model_type === "challenger";
  const isActive = model.is_active !== false;
  const handleAction = (action: ModelAction) => {
    if (onAction) {
      onAction(action, model);
    }
  };
  return <Card className="bg-card/60 border-border/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              {model.model_name} <span className="text-muted-foreground">v{model.model_version}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {model.algorithm || "Algoritmus: ismeretlen"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <CopyBadge text={model.id} showIcon={true} className="font-mono text-xs" aria-label={`Copy model ID: ${model.id}`}>
                ID: {model.id.slice(0, 8)}...
              </CopyBadge>
            </div>
          </div>
          <Badge className={cn("uppercase text-[11px] font-semibold tracking-wide", typeBadgeVariant(model.model_type))}>
            {model.model_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className={cn("uppercase text-[11px] font-semibold tracking-wide", typeBadgeVariant(model.model_type))}>
            {model.model_type}
          </Badge>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Accuracy</p>
            <p className="text-foreground font-medium">{formatPct(model.accuracy)}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Predictions</p>
            <p className="text-foreground font-medium">{model.total_predictions ?? 0}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Traffic</p>
            <p className="text-foreground font-medium">{model.traffic_allocation ?? 0}%</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Registered</p>
            <p className="text-foreground font-medium">{model.registered_at ? new Date(model.registered_at).toLocaleDateString() : "-"}</p>
          </div>
        </div>
        {model.description && <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Description</p>
            <p>{model.description}</p>
          </div>}
        {model.hyperparameters && <div className="text-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-foreground">Hyperparameters</p>
              <CopyButton text={model.hyperparameters} size="sm" variant="outline" successMessage="Hyperparameters copied to clipboard">
                <Copy className="w-3 h-3 mr-1" />
                Copy JSON
              </CopyButton>
            </div>
            <pre className="bg-muted/50 rounded p-2 text-xs font-mono overflow-x-auto">
              {JSON.stringify(JSON.parse(model.hyperparameters), null, 2)}
            </pre>
          </div>}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex gap-2">
          {canPromote && <Button size="sm" onClick={() => onPromote?.(model)}>
              <Zap className="w-4 h-4 mr-2" />
              Promote
            </Button>}
          {onEdit && <Button size="sm" variant="outline" onClick={() => onEdit(model)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>}
        </div>
        {actions.length > 0 && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, index) => {
            const Icon = getActionIcon(action.type);
            return <DropdownMenuItem key={index} onClick={() => handleAction(action)}>
                    <Icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>;
          })}
              {onDelete && <DropdownMenuItem onClick={() => onDelete(model.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>}
      </CardFooter>
    </Card>;
}