import { useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WinmixProPage from "@/winmixpro/components/Page";
import { usePersistentState } from "@/winmixpro/hooks/usePersistentState";
import { winmixFeedbackEntries } from "@/winmixpro/data";
const FILTERS = [{
  value: "mind",
  label: "Összes"
}, {
  value: "nyitott",
  label: "Nyitott"
}, {
  value: "feldolgozva",
  label: "Feldolgozva"
}] as const;
const priorityColor: Record<string, string> = {
  magas: "bg-rose-500/10 text-rose-200",
  közepes: "bg-amber-500/10 text-amber-200",
  alacsony: "bg-sky-500/10 text-sky-200"
};
const AdminFeedback = () => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("mind");
  const [statusOverrides, setStatusOverrides] = usePersistentState<Record<string, "nyitott" | "feldolgozva">>("winmixpro-feedback-status", {});
  const merged = useMemo(() => winmixFeedbackEntries.map(entry => ({
    ...entry,
    status: statusOverrides[entry.id] ?? entry.status
  })), [statusOverrides]);
  const filtered = merged.filter(entry => filter === "mind" ? true : entry.status === filter);
  const openCount = merged.filter(entry => entry.status === "nyitott").length;
  const resolvedCount = merged.length - openCount;
  const toggleStatus = (id: string) => {
    setStatusOverrides(prev => ({
      ...prev,
      [id]: prev[id] === "feldolgozva" ? "nyitott" : "feldolgozva"
    }));
  };
  return <WinmixProPage title="Visszajelzés inbox" description="Felhasználói jelzések és elemzői kommentek, localStorage státuszváltással." actions={<div className="flex gap-2 text-xs text-white/70">
          <Badge className="bg-rose-500/10 text-rose-200">Nyitott: {openCount}</Badge>
          <Badge className="bg-emerald-500/10 text-emerald-200">Feldolgozva: {resolvedCount}</Badge>
        </div>}>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(option => <Button key={option.value} size="sm" variant={filter === option.value ? "default" : "secondary"} className={filter === option.value ? "bg-emerald-500 text-white" : "bg-black/40 text-white/70 hover:bg-black/30"} onClick={() => setFilter(option.value)}>
              {option.label}
            </Button>)}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? <div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-center text-white/60">
            Nincs ilyen státuszú visszajelzés.
          </div> : filtered.map(entry => <div key={entry.id} className="rounded-3xl border border-white/10 bg-black/40 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-white/60" />
                    <p className="text-sm font-semibold text-white">{entry.channel}</p>
                  </div>
                  <p className="text-xs text-white/50">{entry.submitter}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={priorityColor[entry.priority]}>{entry.priority}</Badge>
                  <Badge className={entry.status === "nyitott" ? "bg-rose-500/10 text-rose-200" : "bg-emerald-500/10 text-emerald-200"}>
                    {entry.status === "nyitott" ? "Nyitott" : "Feldolgozva"}
                  </Badge>
                </div>
              </div>
              <p className="mt-3 text-sm text-white/80">{entry.message}</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/50">Beérkezett: {entry.submittedAt}</p>
                <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20" onClick={() => toggleStatus(entry.id)}>
                  {entry.status === "nyitott" ? "Jelölés feldolgozva" : "Vissza a várólistára"}
                </Button>
              </div>
            </div>)}
      </div>
    </WinmixProPage>;
};
export default AdminFeedback;