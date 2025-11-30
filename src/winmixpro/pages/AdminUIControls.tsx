import { useMemo } from "react";
import { Check, Pin, Shapes } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WinmixProPage from "@/winmixpro/components/Page";
import { usePersistentState } from "@/winmixpro/hooks/usePersistentState";
import { winmixUiControls } from "@/winmixpro/data";
const AdminUIControls = () => {
  const [pinned, setPinned] = usePersistentState<string[]>("winmixpro-ui-pins", []);
  const dependencyColumns = useMemo(() => Array.from(new Set(winmixUiControls.flatMap(control => control.dependsOn))), []);
  const togglePin = (id: string) => setPinned(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  return <WinmixProPage title="UI kontroll mátrix" description="Függőségi mátrix és pin-lista a WinmixPro felületek között." actions={<Badge className="bg-white/10 text-white">{pinned.length} kitűzött modul</Badge>}>
      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-black/40">
        <table className="min-w-[700px] w-full text-left text-sm text-white/70">
          <thead>
            <tr>
              <th className="px-4 py-3 text-xs uppercase tracking-[0.4em] text-white/40">Kontroll</th>
              {dependencyColumns.map(dep => <th key={dep} className="px-4 py-3 text-xs uppercase tracking-[0.4em] text-white/40">
                  {dep}
                </th>)}
              <th className="px-4 py-3 text-xs uppercase tracking-[0.4em] text-white/40">Művelet</th>
            </tr>
          </thead>
          <tbody>
            {winmixUiControls.map(control => <tr key={control.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-white">
                  <p className="font-semibold">{control.name}</p>
                  <p className="text-xs text-white/50">{control.surface}</p>
                </td>
                {dependencyColumns.map(dep => <td key={`${control.id}-${dep}`} className="px-4 py-3">
                    {control.dependsOn.includes(dep) ? <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                        <Check className="h-4 w-4" />
                      </span> : <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/20">
                        —
                      </span>}
                  </td>)}
                <td className="px-4 py-3">
                  <Button size="sm" variant="secondary" className={pinned.includes(control.id) ? "bg-emerald-500/20 text-emerald-100" : "bg-white/5 text-white"} onClick={() => togglePin(control.id)}>
                    <Pin className="mr-2 h-4 w-4" /> {pinned.includes(control.id) ? "Kitűzve" : "Pin"}
                  </Button>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        <div className="flex items-center gap-2 text-white">
          <Shapes className="h-5 w-5" />
          <p className="font-semibold">Pin lista</p>
        </div>
        {pinned.length === 0 ? <p className="mt-2">Még nincs kitűzött kontroll.</p> : <ul className="mt-2 list-disc pl-5">
            {pinned.map(id => {
          const control = winmixUiControls.find(item => item.id === id);
          return control ? <li key={id}>{control.name}</li> : null;
        })}
          </ul>}
        <p className="mt-3 text-xs text-white/50">
          A kijelölt modulok a <code>winmixpro-ui-pins</code> kulcson kerülnek mentésre.
        </p>
      </div>
    </WinmixProPage>;
};
export default AdminUIControls;