import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { Slider } from "@/components/ui/slider";
interface SliderSettingProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  icon?: LucideIcon;
  formatValue?: (value: number) => string;
}
const SliderSetting = ({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  onValueChange,
  disabled = false,
  icon: Icon,
  formatValue
}: SliderSettingProps) => {
  const displayValue = useMemo(() => {
    const formatted = formatValue ? formatValue(value) : value.toString();
    return formatted;
  }, [value, formatValue]);
  return <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="h-5 w-5 text-muted-foreground" /> : null}
            <h3 className="text-sm font-medium leading-none sm:text-base">{label}</h3>
          </div>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {displayValue}
        </span>
      </div>
      <Slider min={min} max={max} step={step} defaultValue={[value]} value={[value]} onValueChange={values => onValueChange(values[0] ?? value)} disabled={disabled} />
    </div>;
};
export default SliderSetting;