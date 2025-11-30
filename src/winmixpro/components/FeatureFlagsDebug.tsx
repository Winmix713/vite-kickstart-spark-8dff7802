import { Download, Flag, RefreshCw, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useFeatureFlags } from "@/winmixpro/hooks/useFeatureFlags";
const FeatureFlagsDebug = () => {
  const {
    flags,
    toggleFlag,
    exportFlags,
    importFlags,
    resetFlags
  } = useFeatureFlags();
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const handleExport = () => {
    const exported = exportFlags();
    navigator.clipboard.writeText(exported);
    alert("Feature flags copied to clipboard!");
  };
  const handleImport = () => {
    const result = importFlags(importText);
    if (result.success) {
      setImportText("");
      setImportError(null);
      alert("Feature flags imported successfully!");
    } else {
      setImportError(result.errors?.join(", ") || "Unknown error");
    }
  };
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "feature":
        return "bg-blue-500/20 text-blue-200";
      case "experiment":
        return "bg-purple-500/20 text-purple-200";
      case "killswitch":
        return "bg-red-500/20 text-red-200";
      case "operational":
        return "bg-emerald-500/20 text-emerald-200";
      default:
        return "bg-gray-500/20 text-gray-200";
    }
  };
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Flag className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Feature Flags</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="border-white/30 text-white">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={resetFlags} className="border-white/30 text-white">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
        <h4 className="mb-3 text-sm font-semibold text-white">Import Configuration</h4>
        <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste feature flags JSON here..." className="mb-2 w-full rounded-lg border border-white/15 bg-white/5 p-2 text-sm text-white placeholder:text-white/40" rows={4} />
        {importError && <p className="mb-2 text-xs text-red-400">{importError}</p>}
        <Button variant="outline" size="sm" onClick={handleImport} disabled={!importText} className="border-white/30 text-white">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </div>

      <div className="space-y-2">
        {flags.map(flag => <div key={flag.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h4 className="font-semibold text-white">{flag.name}</h4>
                <Badge className={getCategoryColor(flag.category)}>
                  {flag.category}
                </Badge>
                {flag.rolloutPercentage !== undefined && <span className="text-xs text-white/60">{flag.rolloutPercentage}%</span>}
              </div>
              <p className="text-sm text-white/60">{flag.description}</p>
              {flag.dependencies && flag.dependencies.length > 0 && <p className="mt-1 text-xs text-white/40">
                  Dependencies: {flag.dependencies.join(", ")}
                </p>}
            </div>
            <Switch checked={flag.enabled} onCheckedChange={() => toggleFlag(flag.id)} />
          </div>)}
      </div>
    </div>;
};
export default FeatureFlagsDebug;