import { Check, Heart, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/winmixpro/hooks/useTheme";
const ThemeSelector = () => {
  const {
    currentTheme,
    setTheme,
    presets,
    favorites,
    toggleFavorite
  } = useTheme();
  return <div className="space-y-4">
      <div className="flex items-center gap-2 text-white">
        <Palette className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Téma választó</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {presets.map(preset => {
        const isActive = currentTheme.id === preset.id;
        const isFavorite = favorites.includes(preset.id);
        return <div key={preset.id} className={`relative rounded-2xl border p-4 transition-all ${isActive ? "border-emerald-500 bg-emerald-500/10" : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10"}`}>
              <button onClick={() => setTheme(preset.id)} className="w-full text-left">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{preset.name}</h4>
                    <p className="text-xs text-white/60">{preset.description}</p>
                  </div>
                  {isActive && <Check className="h-5 w-5 text-emerald-400" />}
                </div>

                <div className="mb-2 flex gap-2">
                  <div className={`h-8 w-full rounded bg-gradient-to-r ${preset.palette.gradientFrom}`} />
                </div>

                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className={`rounded-full px-2 py-0.5 ${preset.status === "stable" ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
                    {preset.status === "stable" ? "Stabil" : "Kísérleti"}
                  </span>
                </div>
              </button>

              <Button variant="ghost" size="sm" className="absolute right-2 top-2 h-8 w-8 p-0" onClick={e => {
            e.stopPropagation();
            toggleFavorite(preset.id);
          }}>
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-white/40"}`} />
              </Button>
            </div>;
      })}
      </div>
    </div>;
};
export default ThemeSelector;