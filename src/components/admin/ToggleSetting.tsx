import type { LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
interface ToggleSettingProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  icon?: LucideIcon;
}
const ToggleSetting = ({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  icon: Icon
}: ToggleSettingProps) => <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-5 w-5 text-muted-foreground" /> : null}
        <h3 className="text-sm font-medium leading-none sm:text-base">{label}</h3>
      </div>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
    <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} className="ml-auto" />
  </div>;
export default ToggleSetting;