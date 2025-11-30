import { Heart, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WinmixProPage from "@/winmixpro/components/Page";
import { usePersistentState } from "@/winmixpro/hooks/usePersistentState";
import { WINMIX_PRO_STORAGE_KEYS } from "@/winmixpro/constants";
import { winmixThemeLibrary } from "@/winmixpro/data";
const AdminThemes = () => {
  const [activeTheme, setActiveTheme] = usePersistentState("winmixpro-theme-active", winmixThemeLibrary[0].id);
  const [favorites, setFavorites] = usePersistentState<string[]>("winmixpro-theme-favorites", []);
  const toggleFavorite = (id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const resetLocalState = () => {
    WINMIX_PRO_STORAGE_KEYS.forEach(key => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    });
    window.location.reload();
  };
  return <WinmixProPage title="Téma könyvtár" description="Glass presetek, kedvencek és alapértelmezett kijelölés. Minden módosítás lokálisan kerül mentésre." actions={<Button variant="destructive" size="sm" onClick={resetLocalState}>
          localStorage reset
        </Button>}>
      <div className="grid gap-4 md:grid-cols-2">
        {winmixThemeLibrary.map(theme => <div key={theme.id} className="rounded-3xl border border-white/10 bg-black/40 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{theme.name}</p>
                <p className="text-xs text-white/60">{theme.description}</p>
              </div>
              <Badge className={theme.status === "stabil" ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-500/10 text-amber-200"}>
                {theme.status === "stabil" ? "Stabil" : "Kísérleti"}
              </Badge>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className={`h-12 w-36 rounded-2xl bg-gradient-to-r ${theme.accent}`} />
              <div className={`h-12 w-12 rounded-2xl border border-white/10 ${theme.glass}`} />
              <div className="text-xs text-white/50">Kontraszt: {theme.contrast}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" className={activeTheme === theme.id ? "bg-emerald-500 text-white" : "bg-white/10 text-white hover:bg-white/20"} onClick={() => setActiveTheme(theme.id)}>
                Alapértelmezés
              </Button>
              <Button size="sm" variant="secondary" className={favorites.includes(theme.id) ? "bg-rose-500/20 text-rose-100" : "bg-white/10 text-white"} onClick={() => toggleFavorite(theme.id)}>
                <Heart className="mr-2 h-4 w-4" /> Kedvenc
              </Button>
            </div>
            {activeTheme === theme.id ? <p className="mt-2 text-xs text-emerald-200">Aktív UI profil</p> : null}
          </div>)}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        <div className="flex items-center gap-2 text-white">
          <Palette className="h-5 w-5" />
          <p className="font-semibold">Mentési logika</p>
        </div>
        <p className="mt-2">
          Az aktív téma a <code>winmixpro-theme-active</code>, a kedvencek pedig a <code>winmixpro-theme-favorites</code>
          kulcson kerülnek tárolásra. A fenti "localStorage reset" gomb törli az összes WinmixPro kulcsot ({WINMIX_PRO_STORAGE_KEYS.length} db).
        </p>
      </div>
    </WinmixProPage>;
};
export default AdminThemes;