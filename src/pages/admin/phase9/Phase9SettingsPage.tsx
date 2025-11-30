import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import SliderSetting from "@/components/admin/SliderSetting";
import ToggleSetting from "@/components/admin/ToggleSetting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePhase9Settings } from "@/hooks/admin/usePhase9Settings";
import type { AdminPhase9Settings, AdminPhase9SettingsInput } from "@/types/admin";
interface Phase9FormState extends Omit<AdminPhase9SettingsInput, "market_api_key"> {
  market_api_key: string;
}
const buildFormState = (settings: AdminPhase9Settings): Phase9FormState => ({
  collaborative_intelligence_enabled: settings.collaborative_intelligence_enabled,
  temporal_decay_enabled: settings.temporal_decay_enabled,
  temporal_decay_rate: settings.temporal_decay_rate,
  freshness_check_seconds: settings.freshness_check_seconds,
  staleness_threshold_days: settings.staleness_threshold_days,
  market_integration_mode: settings.market_integration_mode,
  market_api_key: settings.market_api_key ?? "",
  cross_league_enabled: settings.cross_league_enabled,
  cross_league_league_count: settings.cross_league_league_count,
  cross_league_depth: settings.cross_league_depth
});
const Phase9SettingsPage = () => {
  const {
    settings,
    isLoading,
    isSaving,
    saveSettings
  } = usePhase9Settings();
  const [form, setForm] = useState<Phase9FormState | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  useEffect(() => {
    if (settings) {
      setForm(buildFormState(settings));
    }
  }, [settings]);
  const initialState = useMemo(() => settings ? buildFormState(settings) : null, [settings]);
  const isDirty = useMemo(() => {
    if (!form || !initialState) {
      return false;
    }
    return JSON.stringify(form) !== JSON.stringify(initialState);
  }, [form, initialState]);
  const updateForm = useCallback(<K extends keyof Phase9FormState,>(key: K, value: Phase9FormState[K]) => {
    setForm(prev => prev ? {
      ...prev,
      [key]: value
    } : prev);
  }, []);
  const handleNumberChange = (key: keyof Phase9FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (Number.isNaN(value)) {
      return;
    }
    updateForm(key, value as Phase9FormState[typeof key]);
  };
  const buildPayload = useCallback((): Partial<AdminPhase9SettingsInput> => {
    if (!form || !settings) {
      return {};
    }
    const payload: Partial<AdminPhase9SettingsInput> = {};
    (Object.keys(form) as Array<keyof Phase9FormState>).forEach(key => {
      const formValue = form[key];
      const originalValue = initialState?.[key];
      if (formValue === originalValue) {
        return;
      }
      if (key === "market_api_key") {
        payload.market_api_key = form.market_api_key.trim() ? form.market_api_key.trim() : null;
        return;
      }
      const typedKey = key as keyof AdminPhase9SettingsInput;
      payload[typedKey] = formValue as AdminPhase9SettingsInput[keyof AdminPhase9SettingsInput];
    });
    return payload;
  }, [form, initialState, settings]);
  const handleSave = async () => {
    const payload = buildPayload();
    if (!form) {
      return;
    }
    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save");
      return;
    }
    try {
      await saveSettings(payload);
    } catch (error) {
      console.error("Failed to save Phase 9 settings", error);
    }
  };
  if (isLoading || !form) {
    return <AdminLayout title="Phase 9" description="Configure collaborative intelligence and market integrations." breadcrumbs={[{
      label: "Admin",
      href: "/admin"
    }, {
      label: "Phase 9"
    }]}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({
          length: 4
        }).map((_, index) => <Skeleton key={`phase9-skeleton-${index}`} className="h-44 w-full" />)}
        </div>
      </AdminLayout>;
  }
  const statusBadge = form.collaborative_intelligence_enabled ? <Badge variant="default">Active</Badge> : <Badge variant="destructive">Disabled</Badge>;
  return <AdminLayout title="Phase 9" description="Tune collaborative intelligence parameters and rollout strategy." breadcrumbs={[{
    label: "Admin",
    href: "/admin"
  }, {
    label: "Phase 9"
  }]} actions={<Button size="lg" className="gap-2" onClick={() => void handleSave()} disabled={!isDirty || isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "Saving…" : "Save changes"}
        </Button>}>
      <section className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Collaborative intelligence</CardTitle>
              <CardDescription>Control the self-improving behaviour of Phase 9 systems.</CardDescription>
            </div>
            {statusBadge}
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleSetting label="Enable collaborative intelligence" description="Allow analysts to collaborate with AI strategies in realtime." checked={form.collaborative_intelligence_enabled} onCheckedChange={value => updateForm("collaborative_intelligence_enabled", value)} />
            <ToggleSetting label="Enable temporal decay" description="Prioritise recent data when generating predictions." checked={form.temporal_decay_enabled} onCheckedChange={value => updateForm("temporal_decay_enabled", value)} />
            <SliderSetting label="Temporal decay rate" description="Adjust the decay factor between 0 (no decay) and 1 (instant decay)." value={Number(form.temporal_decay_rate.toFixed(2))} min={0} max={1} step={0.01} onValueChange={value => updateForm("temporal_decay_rate", Number(value.toFixed(2)))} formatValue={value => value.toFixed(2)} disabled={!form.temporal_decay_enabled} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Freshness thresholds</CardTitle>
            <CardDescription>Define data retention and validation cycles.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="freshness-check">
                Freshness check (seconds)
              </label>
              <Input id="freshness-check" type="number" min={30} value={form.freshness_check_seconds} onChange={handleNumberChange("freshness_check_seconds")} className="h-11" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="staleness-threshold">
                Staleness threshold (days)
              </label>
              <Input id="staleness-threshold" type="number" min={1} value={form.staleness_threshold_days} onChange={handleNumberChange("staleness_threshold_days")} className="h-11" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market integrations</CardTitle>
            <CardDescription>Control rollout of market-facing automation and API credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="market-mode">
                Mode
              </label>
              <Select value={form.market_integration_mode} onValueChange={value => updateForm("market_integration_mode", value as Phase9FormState["market_integration_mode"])}>
                <SelectTrigger id="market-mode" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="prod">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="market-key">
                Market API key
              </label>
              <div className="flex items-center gap-2">
                <Input id="market-key" type={showApiKey ? "text" : "password"} value={form.market_api_key} onChange={event => updateForm("market_api_key", event.target.value)} placeholder="••••••••••" className="h-11 flex-1" />
                <Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={() => setShowApiKey(prev => !prev)}>
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">Toggle visibility</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cross-league intelligence</CardTitle>
            <CardDescription>Balance breadth and depth of collaborative models across leagues.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleSetting label="Enable cross-league intelligence" description="Share learnings across competitions to accelerate convergence." checked={form.cross_league_enabled} onCheckedChange={value => updateForm("cross_league_enabled", value)} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="league-count">
                  Number of leagues
                </label>
                <Input id="league-count" type="number" min={1} value={form.cross_league_league_count} onChange={handleNumberChange("cross_league_league_count")} disabled={!form.cross_league_enabled} className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="cross-depth">
                  Depth
                </label>
                <Select value={form.cross_league_depth} onValueChange={value => updateForm("cross_league_depth", value as Phase9FormState["cross_league_depth"])} disabled={!form.cross_league_enabled}>
                  <SelectTrigger id="cross-depth" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </AdminLayout>;
};
export default Phase9SettingsPage;