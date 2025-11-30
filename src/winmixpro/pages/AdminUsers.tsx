import { useMemo, useState } from "react";
import { Filter, Search, Users as UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import WinmixProMetricCard from "@/winmixpro/components/MetricCard";
import WinmixProPage from "@/winmixpro/components/Page";
import { usePersistentState } from "@/winmixpro/hooks/usePersistentState";
import { winmixUserMetrics, winmixUsers } from "@/winmixpro/data";
const ROLE_FILTERS: Array<{
  value: "mind" | "admin" | "elemzo" | "megfigyelo";
  label: string;
}> = [{
  value: "mind",
  label: "Összes"
}, {
  value: "admin",
  label: "Admin"
}, {
  value: "elemzo",
  label: "Elemző"
}, {
  value: "megfigyelo",
  label: "Megfigyelő"
}];
const AdminUsers = () => {
  const [roleFilter, setRoleFilter] = usePersistentState<"mind" | "admin" | "elemzo" | "megfigyelo">("winmixpro-users-filter", "mind");
  const [onlyActive, setOnlyActive] = usePersistentState("winmixpro-users-active", true);
  const [search, setSearch] = useState("");
  const filteredUsers = useMemo(() => winmixUsers.filter(user => {
    const matchesRole = roleFilter === "mind" || user.role === roleFilter;
    const matchesStatus = !onlyActive || user.status === "Aktív";
    const matchesSearch = search.trim().length === 0 || user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch;
  }), [roleFilter, onlyActive, search]);
  return <WinmixProPage title="Felhasználók és jogosultságok" description="Admin, elemző és megfigyelő szerepkörök kezelése, lokális prototípus adatforrással." actions={<Button variant="outline" size="sm" className="border-white/30 text-white">
          <Filter className="mr-2 h-4 w-4" />
          Export CSV
        </Button>}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <WinmixProMetricCard label="Aktív felhasználók" value={`${winmixUserMetrics.active}`} hint="Az elmúlt 24 órában" trend="+4 új belépés" intent="positive" icon={UsersIcon} />
        <WinmixProMetricCard label="Elemzők" value={`${winmixUserMetrics.analysts}`} hint="AI stúdió jogosultsággal" trend="stabil" intent="neutral" />
        <WinmixProMetricCard label="Meghívók" value={`${winmixUserMetrics.invites}`} hint="Küldésre vár" trend="-1 nap" intent="warning" />
      </div>

      <div className="rounded-3xl border border-white/15 bg-white/5 p-4 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {ROLE_FILTERS.map(filter => <Button key={filter.value} size="sm" variant={filter.value === roleFilter ? "default" : "secondary"} className={filter.value === roleFilter ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-white/5 text-white/70 hover:bg-white/10"} onClick={() => setRoleFilter(filter.value)}>
                {filter.label}
              </Button>)}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
              Csak aktív
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Keresés név vagy email alapján" className="bg-white/5 pl-9 text-white placeholder:text-white/50" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Név</TableHead>
              <TableHead>Szerepkör</TableHead>
              <TableHead>Szegmensek</TableHead>
              <TableHead>Aktivitás</TableHead>
              <TableHead className="text-right">Ország</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => <TableRow key={user.id} className="border-white/5">
                <TableCell>
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-white/60">{user.email}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {user.roleLabel}
                  </Badge>
                  <div className="text-xs text-white/60">
                    {user.status} • utolsó aktivitás {user.lastSeenMinutes} perce
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {user.segments.map(segment => <Badge key={segment} className="bg-emerald-500/10 text-emerald-200">
                        {segment}
                      </Badge>)}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${user.status === "Aktív" ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-500/10 text-amber-200"}`}>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="text-right text-white/70">{user.locale}</TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
        {filteredUsers.length === 0 ? <div className="px-6 py-8 text-center text-sm text-white/60">
            Nincs a szűrőnek megfelelő felhasználó.
          </div> : null}
      </div>
    </WinmixProPage>;
};
export default AdminUsers;