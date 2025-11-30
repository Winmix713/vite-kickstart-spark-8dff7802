import { useState, useEffect, useCallback } from "react";
import { Download, Upload, Save, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
    };
  };
}
const PRESET_THEMES: ThemePreset[] = [{
  id: "emerald-dark",
  name: "Smaragd sötét",
  description: "Prémium sötét téma smaragd akcentussal",
  colors: {
    primary: "#10b981",
    secondary: "#f97316",
    accent: "#10b981",
    background: "#0f172a",
    foreground: "#f1f5f9"
  },
  typography: {
    fontFamily: "Inter",
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20
    }
  }
}, {
  id: "azure-dark",
  name: "Azúr sötét",
  description: "Modern azúr téma fejlesztőknek",
  colors: {
    primary: "#0ea5e9",
    secondary: "#ec4899",
    accent: "#0ea5e9",
    background: "#0c1117",
    foreground: "#f8f9fa"
  },
  typography: {
    fontFamily: "Inter",
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20
    }
  }
}, {
  id: "violet-dark",
  name: "Ibolya sötét",
  description: "Kreatív és inspiráló ibolya téma",
  colors: {
    primary: "#a855f7",
    secondary: "#06b6d4",
    accent: "#a855f7",
    background: "#1a1a2e",
    foreground: "#eaeaea"
  },
  typography: {
    fontFamily: "Inter",
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20
    }
  }
}];
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}
const ColorPicker = ({
  label,
  value,
  onChange
}: ColorPickerProps) => <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex gap-3 items-center">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder="#000000" className="flex-1" />
    </div>
  </div>;
const PresetCard = ({
  preset,
  isActive,
  onClick
}: {
  preset: ThemePreset;
  isActive: boolean;
  onClick: () => void;
}) => <Card onClick={onClick} className={cn("glass-card p-4 cursor-pointer transition-all hover:bg-white/10 group", isActive && "ring-2 ring-emerald-500")}>
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-semibold text-sm">{preset.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
      </div>
      {isActive && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
    </div>

    <div className="flex gap-2 mt-4">
      {Object.entries(preset.colors).map(([key, value]) => <div key={key} title={key} className="w-6 h-6 rounded border border-white/10" style={{
      backgroundColor: value
    }} />)}
    </div>
  </Card>;
const DesignPreview = ({
  theme
}: {
  theme: ThemePreset;
}) => <Card className="glass-card p-6">
    <h3 className="font-semibold mb-4">Élő előnézet</h3>
    <div className="space-y-4">
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded text-white transition-all" style={{
        backgroundColor: theme.colors.primary
      }}>
          Elsődleges
        </button>
        <button className="px-4 py-2 rounded text-white transition-all" style={{
        backgroundColor: theme.colors.secondary
      }}>
          Másodlagos
        </button>
        <button className="px-4 py-2 rounded text-white transition-all" style={{
        backgroundColor: theme.colors.accent
      }}>
          Kiemelt
        </button>
      </div>

      <div className="p-4 rounded" style={{
      backgroundColor: theme.colors.background,
      color: theme.colors.foreground,
      fontFamily: theme.typography.fontFamily
    }}>
        <div style={{
        fontSize: `${theme.typography.fontSize.base}px`
      }}>
          Ez az előnézet az aktuális témával
        </div>
        <div className="mt-2 opacity-70" style={{
        fontSize: `${theme.typography.fontSize.sm}px`
      }}>
          Másodlagos szöveg
        </div>
      </div>
    </div>
  </Card>;
const WinmixProAdminDesign = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(PRESET_THEMES[0]);
  const [activePreset, setActivePreset] = useState<string>(PRESET_THEMES[0].id);
  const [customTheme, setCustomTheme] = useState<ThemePreset>(PRESET_THEMES[0]);
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Load saved theme from localStorage
    const saved = localStorage.getItem("winmixpro-theme");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentTheme(parsed);
        setCustomTheme(parsed);
      } catch (e) {
        console.error("Failed to load saved theme:", e);
      }
    }
  }, []);
  const handlePresetSelect = useCallback((preset: ThemePreset) => {
    setCurrentTheme(preset);
    setCustomTheme(preset);
    setActivePreset(preset.id);
    setShowCustomEditor(false);
    toast({
      title: "Téma kiválasztva",
      description: `${preset.name} téma alkalmzálva.`
    });
  }, [toast]);
  const handleColorChange = useCallback((key: keyof ThemePreset["colors"], value: string) => {
    const updated = {
      ...customTheme,
      colors: {
        ...customTheme.colors,
        [key]: value
      }
    };
    setCustomTheme(updated);
    setCurrentTheme(updated);
  }, [customTheme]);
  const handleSaveCustom = useCallback(() => {
    localStorage.setItem("winmixpro-theme", JSON.stringify(customTheme));
    setActivePreset("");
    toast({
      title: "Egyéni téma mentve",
      description: "Az egyéni téma sikeresen mentve."
    });
  }, [customTheme, toast]);
  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(currentTheme, null, 2);
    const dataBlob = new Blob([dataStr], {
      type: "application/json"
    });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `theme-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Téma exportálva",
      description: "A téma sikeresen exportálva JSON formátumba."
    });
  }, [currentTheme, toast]);
  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const imported = JSON.parse(event.target?.result as string) as ThemePreset;
          setCustomTheme(imported);
          setCurrentTheme(imported);
          setShowCustomEditor(true);
          setActivePreset("");
          toast({
            title: "Téma importálva",
            description: "A téma sikeresen importálva."
          });
        } catch (error) {
          toast({
            title: "Importálási hiba",
            description: "Az importált fájl érvénytelen JSON formátumú.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [toast]);
  return <AdminLayout title="Terv és megjelenés" description="Témabeállítások, szín- és tipográfia konfigurálása" breadcrumbs={[{
    label: "WinmixPro",
    href: "/winmixpro/admin"
  }, {
    label: "Terv"
  }]}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-1 space-y-6">
          <DesignPreview theme={currentTheme} />

          {/* Controls */}
          <Card className="glass-card p-4 space-y-3">
            <Button onClick={handleSaveCustom} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Egyéni téma mentése
            </Button>
            <Button variant="outline" onClick={handleExport} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Exportálás
            </Button>
            <Button variant="outline" onClick={handleImport} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Importálás
            </Button>
          </Card>
        </div>

        {/* Theme Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Presets */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Téma előbeállítások</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRESET_THEMES.map(preset => <PresetCard key={preset.id} preset={preset} isActive={activePreset === preset.id} onClick={() => handlePresetSelect(preset)} />)}
            </div>
          </div>

          {/* Custom Editor */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Szín testreszabás</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCustomEditor(!showCustomEditor)}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {showCustomEditor && <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <ColorPicker label="Elsődleges szín" value={customTheme.colors.primary} onChange={val => handleColorChange("primary", val)} />
                <ColorPicker label="Másodlagos szín" value={customTheme.colors.secondary} onChange={val => handleColorChange("secondary", val)} />
                <ColorPicker label="Kiemelt szín" value={customTheme.colors.accent} onChange={val => handleColorChange("accent", val)} />
                <ColorPicker label="Háttér szín" value={customTheme.colors.background} onChange={val => handleColorChange("background", val)} />
                <ColorPicker label="Előtér szín" value={customTheme.colors.foreground} onChange={val => handleColorChange("foreground", val)} />
              </div>}
          </Card>

          {/* Typography */}
          <Card className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Tipográfia</h2>
            <div className="space-y-4">
              <div>
                <Label>Betűtípus család</Label>
                <div className="text-sm text-muted-foreground mt-1">{customTheme.typography.fontFamily}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(customTheme.typography.fontSize).map(([key, size]) => <div key={key} className="text-center">
                    <p className="text-xs text-muted-foreground uppercase">{key}</p>
                    <p style={{
                  fontSize: `${size}px`
                }} className="mt-2">
                      Aa
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{size}px</p>
                  </div>)}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>;
};
export default WinmixProAdminDesign;