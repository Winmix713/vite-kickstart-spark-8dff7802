import { useState, useEffect, useCallback } from "react";
import { Download, Upload, Plus, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: number;
  category: string;
}
const MOCK_FEATURES: Feature[] = [{
  id: "predictive-analytics",
  name: "Prediktív analitika",
  description: "Fejlett predikciós modelleket használó adatelemzés",
  enabled: true,
  rollout: 100,
  category: "Analitika"
}, {
  id: "ai-recommendations",
  name: "AI ajánlások",
  description: "Mesterséges intelligencia alapú ajánlási motor",
  enabled: true,
  rollout: 85,
  category: "AI"
}, {
  id: "real-time-alerts",
  name: "Valós idejű figyelmeztetések",
  description: "Azonnali értesítések fontos eseményekről",
  enabled: false,
  rollout: 0,
  category: "Értesítések"
}, {
  id: "advanced-search",
  name: "Speciális keresés",
  description: "Kiterjesztett keresési lehetőségek és szűrők",
  enabled: true,
  rollout: 95,
  category: "Keresés"
}, {
  id: "data-export",
  name: "Adatexportálás",
  description: "Adatok exportálása különféle formátumokba",
  enabled: true,
  rollout: 100,
  category: "Adatok"
}, {
  id: "team-collaboration",
  name: "Csapatmunka",
  description: "Valós idejű közös munka és megosztás",
  enabled: false,
  rollout: 30,
  category: "Kollaboráció"
}, {
  id: "dark-mode",
  name: "Sötét mód",
  description: "Teljes sötét téma a felhasználói felülethez",
  enabled: true,
  rollout: 100,
  category: "Megjelenés"
}, {
  id: "mobile-app",
  name: "Mobil alkalmazás",
  description: "Natív mobil alkalmazás iOS és Android számára",
  enabled: false,
  rollout: 50,
  category: "Mobil"
}, {
  id: "api-webhooks",
  name: "API Webhookok",
  description: "Webhook integrációk külső rendszerekhez",
  enabled: true,
  rollout: 75,
  category: "Integráció"
}, {
  id: "custom-dashboards",
  name: "Egyéni irányítópultok",
  description: "Felhasználó-specifikus irányítópult személyre szabása",
  enabled: false,
  rollout: 40,
  category: "Testreszabás"
}, {
  id: "advanced-reporting",
  name: "Haladó jelentéskövetkeztetés",
  description: "Összetett jelentések és elemzések",
  enabled: true,
  rollout: 80,
  category: "Jelentések"
}, {
  id: "performance-metrics",
  name: "Teljesítménymérések",
  description: "Részletes teljesítményadatok és metrikák",
  enabled: true,
  rollout: 90,
  category: "Teljesítmény"
}];
interface FeatureItemProps {
  feature: Feature;
  onToggle: (id: string) => void;
  onRolloutChange: (id: string, value: number) => void;
  onDelete: (id: string) => void;
}
const FeatureItem = ({
  feature,
  onToggle,
  onRolloutChange,
  onDelete
}: FeatureItemProps) => <Card className="glass-card p-4 hover:bg-white/10 transition-colors">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <h3 className="font-semibold text-sm">{feature.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
        <span className="text-xs bg-white/10 px-2 py-1 rounded mt-2 inline-block">{feature.category}</span>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={feature.enabled} onChange={() => onToggle(feature.id)} />
        <Button variant="ghost" size="sm" onClick={() => onDelete(feature.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>

    {feature.enabled && <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span>Rollout százalék</span>
          <span className="font-semibold text-emerald-400">{feature.rollout}%</span>
        </div>
        <Slider value={[feature.rollout]} onValueChange={val => onRolloutChange(feature.id, val[0])} min={0} max={100} step={5} className="w-full" />
      </div>}
  </Card>;
const WinmixProAdminFeatures = () => {
  const [features, setFeatures] = useState<Feature[]>(MOCK_FEATURES);
  const [filterText, setFilterText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const {
    toast
  } = useToast();
  const categories = Array.from(new Set(features.map(f => f.category)));
  const filteredFeatures = features.filter(f => {
    const matchesText = f.name.toLowerCase().includes(filterText.toLowerCase()) || f.description.toLowerCase().includes(filterText.toLowerCase());
    const matchesCategory = !selectedCategory || f.category === selectedCategory;
    return matchesText && matchesCategory;
  });
  const handleToggle = useCallback((id: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? {
      ...f,
      enabled: !f.enabled,
      rollout: !f.enabled ? f.rollout : 0
    } : f));
  }, []);
  const handleRolloutChange = useCallback((id: string, value: number) => {
    setFeatures(prev => prev.map(f => f.id === id ? {
      ...f,
      rollout: value
    } : f));
  }, []);
  const handleDelete = useCallback((id: string) => {
    setFeatures(prev => prev.filter(f => f.id !== id));
    toast({
      title: "Funkció eltávolítva",
      description: "A funkció sikeresen eltávolítva."
    });
  }, [toast]);
  const handleBulkEnable = useCallback(() => {
    setFeatures(prev => prev.map(f => ({
      ...f,
      enabled: true,
      rollout: 100
    })));
    toast({
      title: "Az összes funkció engedélyezve",
      description: "Összes funkció engedélyeztve 100%-os rollouttal."
    });
  }, [toast]);
  const handleBulkDisable = useCallback(() => {
    setFeatures(prev => prev.map(f => ({
      ...f,
      enabled: false,
      rollout: 0
    })));
    toast({
      title: "Az összes funkció letiltva",
      description: "Összes funkció letiltva."
    });
  }, [toast]);
  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(features, null, 2);
    const dataBlob = new Blob([dataStr], {
      type: "application/json"
    });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `feature-flags-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Exportálás sikeres",
      description: "A funkciók sikeresen exportálva JSON formátumba."
    });
  }, [features, toast]);
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
          const imported = JSON.parse(event.target?.result as string) as Feature[];
          setFeatures(imported);
          toast({
            title: "Importálás sikeres",
            description: "A funkciók sikeresen importálva."
          });
        } catch (error) {
          toast({
            title: "Hiba az importálásban",
            description: "Az importált fájl érvénytelen JSON formátumú.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [toast]);
  const enabledCount = features.filter(f => f.enabled).length;
  const totalCount = features.length;
  return <AdminLayout title="Funkciók kezelése" description="Funkciók engedélyezése, letiltása és rollout konfigurálása" breadcrumbs={[{
    label: "WinmixPro",
    href: "/winmixpro/admin"
  }, {
    label: "Funkciók"
  }]}>
      {/* Stats Bar */}
      <Card className="glass-card p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Funkciók áttekintése</h3>
            <p className="text-sm text-muted-foreground">
              {enabledCount} / {totalCount} funkció engedélyezve
            </p>
          </div>
          <div className="mt-4 md:mt-0 w-full md:w-32 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500" style={{
            width: `${enabledCount / totalCount * 100}%`
          }} />
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input placeholder="Funkciók szűrése..." value={filterText} onChange={e => setFilterText(e.target.value)} className="flex-1" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkEnable}>
            <Plus className="w-4 h-4 mr-2" />
            Összes engedélyezése
          </Button>
          <Button variant="outline" onClick={handleBulkDisable}>
            Összes letiltása
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportálás
          </Button>
          <Button variant="outline" onClick={handleImport}>
            <Upload className="w-4 h-4 mr-2" />
            Importálás
          </Button>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button variant={selectedCategory === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>
          Összes ({totalCount})
        </Button>
        {categories.map(cat => {
        const count = features.filter(f => f.category === cat).length;
        return <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)}>
              {cat} ({count})
            </Button>;
      })}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        {filteredFeatures.map(feature => <FeatureItem key={feature.id} feature={feature} onToggle={handleToggle} onRolloutChange={handleRolloutChange} onDelete={handleDelete} />)}
      </div>

      {filteredFeatures.length === 0 && <Card className="glass-card p-12 text-center">
          <p className="text-muted-foreground">Nincsenek funkciók a megadott szűrésnek megfelelően</p>
        </Card>}
    </AdminLayout>;
};
export default WinmixProAdminFeatures;