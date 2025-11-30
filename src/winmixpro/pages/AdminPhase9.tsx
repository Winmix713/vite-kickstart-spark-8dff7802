import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import WinmixProPage from "@/winmixpro/components/Page";
import { usePersistentState } from "@/winmixpro/hooks/usePersistentState";
import { winmixPhase9Defaults, type WinmixPhase9SettingsState } from "@/winmixpro/data";
const marketModes = [{
  value: "off",
  label: "Kikapcsolva"
}, {
  value: "test",
  label: "Teszt mód"
}, {
  value: "prod",
  label: "Éles"
}] as const;
const AdminPhase9 = () => {
  const [settings, setSettings] = usePersistentState<WinmixPhase9SettingsState>("winmixpro-phase9-settings", winmixPhase9Defaults);
  const updateSetting = (partial: Partial<WinmixPhase9SettingsState>) => setSettings(prev => ({
    ...prev,
    ...partial
  }));
  return <WinmixProPage title="Phase 9 vezérlő" description="Kollaboratív intelligencia, temporal decay és piaci súlyok – minden érték localStorage-ban tárolva.">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Kollaboratív intelligencia</p>
              <p className="text-xs text-white/60">
                Crowd súly hozzáadás a modell pipeline-ba
              </p>
            </div>
            <Switch checked={settings.collaborative} onCheckedChange={checked => updateSetting({
            collaborative: checked
          })} />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">Piaci mód</p>
          <div className="mt-3 flex gap-2">
            {marketModes.map(mode => <Button key={mode.value} size="sm" variant={mode.value === settings.marketMode ? "default" : "secondary"} className={mode.value === settings.marketMode ? "bg-emerald-500 text-white" : "bg-black/40 text-white/70 hover:bg-black/30"} onClick={() => updateSetting({
            marketMode: mode.value
          })}>
                {mode.label}
              </Button>)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
          <p className="text-sm font-semibold text-white">Temporal decay</p>
          <p className="text-xs text-white/60">Percekben megadva, exponenciális súlyozásra</p>
          <Slider value={[settings.temporalDecay]} max={72} min={4} step={4} onValueChange={([value]) => updateSetting({
          temporalDecay: value
        })} className="mt-6" />
          <p className="mt-2 text-sm text-white">{settings.temporalDecay} perc</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
          <p className="text-sm font-semibold text-white">Crowd súly</p>
          <p className="text-xs text-white/60">Model vs közösség súlyarány</p>
          <Slider value={[settings.crowdWeight]} max={60} min={10} step={2} onValueChange={([value]) => updateSetting({
          crowdWeight: value
        })} className="mt-6" />
          <p className="mt-2 text-sm text-white">{settings.crowdWeight}% crowd, {100 - settings.crowdWeight}% modell</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold text-white">Frissességi küszöb</p>
        <p className="text-xs text-white/60">Perc alapú cutoff a pipeline figyelmeztetésekhez</p>
        <Slider value={[settings.freshnessMinutes]} max={60} min={10} step={2} onValueChange={([value]) => updateSetting({
        freshnessMinutes: value
      })} className="mt-6" />
        <p className="mt-2 text-sm text-white">{settings.freshnessMinutes} perc</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
        A fenti értékek a <code>winmixpro-phase9-settings</code> kulcs alatt kerülnek mentésre a localStorage-ban. A "Reset
        ellenőrzés" gomb a Téma oldalon az összes WinmixPro beállítást törli.
      </div>
    </WinmixProPage>;
};
export default AdminPhase9;