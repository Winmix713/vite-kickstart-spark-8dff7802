import { useState, useMemo } from "react";
import { AlertCircle, CheckCircle, Zap, Loader } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
interface ComponentDependency {
  name: string;
  status: "loaded" | "pending" | "error";
  size: number; // KB
}
interface ComponentCategory {
  id: string;
  name: string;
  description: string;
  health: "healthy" | "warning" | "error";
  componentCount: number;
  avgLoadTime: number;
  dependencies: ComponentDependency[];
  metrics: {
    renderTime: number;
    memoryUsage: number;
    reRenders: number;
  };
}
const COMPONENT_CATEGORIES: ComponentCategory[] = [{
  id: "ui-core",
  name: "UI alapok",
  description: "Alap UI komponensek (Button, Card, Input, stb.)",
  health: "healthy",
  componentCount: 24,
  avgLoadTime: 125,
  dependencies: [{
    name: "@radix-ui/react-dialog",
    status: "loaded",
    size: 45
  }, {
    name: "tailwindcss",
    status: "loaded",
    size: 320
  }, {
    name: "class-variance-authority",
    status: "loaded",
    size: 12
  }],
  metrics: {
    renderTime: 3.2,
    memoryUsage: 2.4,
    reRenders: 1847
  }
}, {
  id: "forms",
  name: "Formok",
  description: "Form komponensek és validáció",
  health: "healthy",
  componentCount: 12,
  avgLoadTime: 156,
  dependencies: [{
    name: "react-hook-form",
    status: "loaded",
    size: 28
  }, {
    name: "@hookform/resolvers",
    status: "loaded",
    size: 15
  }, {
    name: "zod",
    status: "loaded",
    size: 32
  }],
  metrics: {
    renderTime: 4.1,
    memoryUsage: 3.2,
    reRenders: 945
  }
}, {
  id: "data-display",
  name: "Adat megjelenítés",
  description: "Táblázatok, listások, grafikonok",
  health: "healthy",
  componentCount: 18,
  avgLoadTime: 182,
  dependencies: [{
    name: "recharts",
    status: "loaded",
    size: 185
  }, {
    name: "react-table",
    status: "loaded",
    size: 42
  }, {
    name: "@tanstack/react-table",
    status: "loaded",
    size: 48
  }],
  metrics: {
    renderTime: 6.5,
    memoryUsage: 5.8,
    reRenders: 2345
  }
}, {
  id: "navigation",
  name: "Navigáció",
  description: "Menüs, breadcrumbsok, léptetők",
  health: "warning",
  componentCount: 14,
  avgLoadTime: 198,
  dependencies: [{
    name: "react-router-dom",
    status: "loaded",
    size: 65
  }, {
    name: "@radix-ui/react-navigation-menu",
    status: "loaded",
    size: 22
  }, {
    name: "lucide-react",
    status: "loaded",
    size: 185
  }],
  metrics: {
    renderTime: 7.2,
    memoryUsage: 4.5,
    reRenders: 3120
  }
}, {
  id: "modals-popovers",
  name: "Ablakok és felugró",
  description: "Dialógusok, popoverek, szövegbuborékok",
  health: "healthy",
  componentCount: 11,
  avgLoadTime: 145,
  dependencies: [{
    name: "@radix-ui/react-dialog",
    status: "loaded",
    size: 45
  }, {
    name: "@radix-ui/react-popover",
    status: "loaded",
    size: 38
  }, {
    name: "vaul",
    status: "loaded",
    size: 28
  }],
  metrics: {
    renderTime: 4.8,
    memoryUsage: 2.9,
    reRenders: 567
  }
}, {
  id: "notifications",
  name: "Értesítések",
  description: "Toastok, értesítések, figyelmeztetések",
  health: "error",
  componentCount: 7,
  avgLoadTime: 89,
  dependencies: [{
    name: "sonner",
    status: "loaded",
    size: 35
  }, {
    name: "@radix-ui/react-toast",
    status: "error",
    size: 42
  }, {
    name: "react-hot-toast",
    status: "pending",
    size: 24
  }],
  metrics: {
    renderTime: 2.1,
    memoryUsage: 1.2,
    reRenders: 4532
  }
}, {
  id: "layouts",
  name: "Elrendezések",
  description: "Sidebar, grid, responsive layoutok",
  health: "healthy",
  componentCount: 16,
  avgLoadTime: 167,
  dependencies: [{
    name: "react-resizable-panels",
    status: "loaded",
    size: 52
  }, {
    name: "tailwindcss",
    status: "loaded",
    size: 320
  }],
  metrics: {
    renderTime: 5.3,
    memoryUsage: 3.8,
    reRenders: 2156
  }
}, {
  id: "admin-specific",
  name: "Admin specifikus",
  description: "Admin irányítópult komponensek",
  health: "healthy",
  componentCount: 22,
  avgLoadTime: 201,
  dependencies: [{
    name: "@tanstack/react-query",
    status: "loaded",
    size: 75
  }, {
    name: "recharts",
    status: "loaded",
    size: 185
  }, {
    name: "lucide-react",
    status: "loaded",
    size: 185
  }],
  metrics: {
    renderTime: 8.9,
    memoryUsage: 6.2,
    reRenders: 3845
  }
}];
interface DependencyBadgeProps {
  dependency: ComponentDependency;
}
const DependencyBadge = ({
  dependency
}: DependencyBadgeProps) => <Badge variant="outline" className={cn("text-xs", dependency.status === "loaded" && "bg-green-500/10 text-green-400 border-green-500/30", dependency.status === "pending" && "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", dependency.status === "error" && "bg-red-500/10 text-red-400 border-red-500/30")}>
    {dependency.status === "loaded" && <CheckCircle className="w-3 h-3 mr-1" />}
    {dependency.status === "pending" && <Loader className="w-3 h-3 mr-1 animate-spin" />}
    {dependency.status === "error" && <AlertCircle className="w-3 h-3 mr-1" />}
    {dependency.name} ({dependency.size}kb)
  </Badge>;
interface HealthBadgeProps {
  health: "healthy" | "warning" | "error";
}
const HealthBadge = ({
  health
}: HealthBadgeProps) => <Badge className={cn("text-xs", health === "healthy" && "bg-green-500/20 text-green-300 border-green-500/30", health === "warning" && "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", health === "error" && "bg-red-500/20 text-red-300 border-red-500/30")} variant="outline">
    {health === "healthy" && <CheckCircle className="w-3 h-3 mr-1" />}
    {health === "warning" && <AlertCircle className="w-3 h-3 mr-1" />}
    {health === "error" && <AlertCircle className="w-3 h-3 mr-1" />}
    {health === "healthy" && "Kifogástalan"}
    {health === "warning" && "Figyelem"}
    {health === "error" && "Hiba"}
  </Badge>;
interface CategoryCardProps {
  category: ComponentCategory;
}
const CategoryCard = ({
  category
}: CategoryCardProps) => <Card className="glass-card p-6 hover:bg-white/10 transition-colors">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="font-semibold">{category.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
      </div>
      <HealthBadge health={category.health} />
    </div>

    <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-white/10">
      <div>
        <p className="text-xs text-muted-foreground">Komponensek</p>
        <p className="text-lg font-semibold">{category.componentCount}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Átlagos idő</p>
        <p className="text-lg font-semibold">{category.avgLoadTime}ms</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Függőségek</p>
        <p className="text-lg font-semibold">{category.dependencies.length}</p>
      </div>
    </div>

    <div>
      <h4 className="text-sm font-semibold mb-2">Teljesítménymérések</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Render idő</span>
          <span>{category.metrics.renderTime}ms</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{
          width: `${category.metrics.renderTime / 15 * 100}%`
        }} />
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-muted-foreground">Memória</span>
          <span>{category.metrics.memoryUsage}MB</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600" style={{
          width: `${category.metrics.memoryUsage / 20 * 100}%`
        }} />
        </div>
      </div>
    </div>
  </Card>;
const WinmixProAdminComponents = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const stats = useMemo(() => ({
    total: COMPONENT_CATEGORIES.length,
    healthy: COMPONENT_CATEGORIES.filter(c => c.health === "healthy").length,
    warning: COMPONENT_CATEGORIES.filter(c => c.health === "warning").length,
    error: COMPONENT_CATEGORIES.filter(c => c.health === "error").length,
    totalComponents: COMPONENT_CATEGORIES.reduce((sum, c) => sum + c.componentCount, 0),
    avgLoadTime: Math.round(COMPONENT_CATEGORIES.reduce((sum, c) => sum + c.avgLoadTime, 0) / COMPONENT_CATEGORIES.length)
  }), []);
  const selectedCategoryData = selectedCategory ? COMPONENT_CATEGORIES.find(c => c.id === selectedCategory) : null;
  return <AdminLayout title="Komponens irányítás" description="UI komponensek, függőségek és teljesítménymérések" breadcrumbs={[{
    label: "WinmixPro",
    href: "/winmixpro/admin"
  }, {
    label: "Komponensek"
  }]}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Összesen</p>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-2">Kategória</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Kifogástalan</p>
          <p className="text-2xl font-bold text-green-400">{stats.healthy}</p>
          <p className="text-xs text-muted-foreground mt-2">Kategória</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Figyelem</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.warning}</p>
          <p className="text-xs text-muted-foreground mt-2">Kategória</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Hiba</p>
          <p className="text-2xl font-bold text-red-400">{stats.error}</p>
          <p className="text-xs text-muted-foreground mt-2">Kategória</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Összes komp.</p>
          <p className="text-2xl font-bold">{stats.totalComponents}</p>
          <p className="text-xs text-muted-foreground mt-2">darab</p>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Áttekintés</TabsTrigger>
          <TabsTrigger value="details">Részletek</TabsTrigger>
          <TabsTrigger value="performance">Teljesítmény</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {COMPONENT_CATEGORIES.map(category => <div key={category.id} onClick={() => setSelectedCategory(category.id)} className="cursor-pointer">
                <CategoryCard category={category} />
              </div>)}
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          {selectedCategoryData ? <Card className="glass-card p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">{selectedCategoryData.name}</h2>
                <p className="text-muted-foreground">{selectedCategoryData.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Függőségek</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCategoryData.dependencies.map((dep, idx) => <DependencyBadge key={idx} dependency={dep} />)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Render idő</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    {selectedCategoryData.metrics.renderTime}ms
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Memória</p>
                  <p className="text-lg font-semibold">{selectedCategoryData.metrics.memoryUsage}MB</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Újra-renderelések</p>
                  <p className="text-lg font-semibold">{selectedCategoryData.metrics.reRenders}</p>
                </div>
              </div>
            </Card> : <Card className="glass-card p-12 text-center">
              <p className="text-muted-foreground">Válasszon egy kategóriát a részletek megtekintéséhez</p>
            </Card>}
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="space-y-4">
            {COMPONENT_CATEGORIES.sort((a, b) => b.metrics.renderTime - a.metrics.renderTime).map(category => <Card key={category.id} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">{category.avgLoadTime}ms átlag</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{category.metrics.renderTime}ms</p>
                      <p className="text-xs text-muted-foreground">{category.metrics.memoryUsage}MB</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all", category.metrics.renderTime < 5 && "bg-green-500", category.metrics.renderTime >= 5 && category.metrics.renderTime < 8 && "bg-yellow-500", category.metrics.renderTime >= 8 && "bg-red-500")} style={{
                width: `${category.metrics.renderTime / 15 * 100}%`
              }} />
                  </div>
                </Card>)}
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>;
};
export default WinmixProAdminComponents;