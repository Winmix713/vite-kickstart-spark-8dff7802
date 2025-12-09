import React, { useMemo, useState } from "react";
import { Filter, Search, Users as UsersIcon } from MetricCard from "../../components/MetricCard"; import PageHeader from "@layout/PageHeader";
import { winmixUserMetrics, winmixUsers } from { usePersistentState } from "../../hooks/usePersistentState"; import Switch from "@ui/Switch";
import classNames from 'classnames';

const ROLE_FILTERS = [ { value: "mind", label: "Összes" }, { value: "admin", label: "Admin" }, { value: "elemzo", label: "Elemző" }, { value: "megfigyelo", label: "Megfigyelő" }, ]; const Badge = ({ className, variant = "default", children }) => { const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus: outline-none focus, ring-2 focus:ring-ring focus:ring-offset-2"; return ( <span className={classNames(baseClasses, className)}> {children} </span> ); }; const AdminUsers = () => { const[roleFilter, setRoleFilter] = usePersistentState( "winmixpro-users-filter", "mind", ); const[onlyActive, setOnlyActive] = usePersistentState("winmixpro-users-active", true); const[search, setSearch] = useState(""); const filteredUsers = useMemo( () => winmixUsers.filter((user) => { const matchesRole = roleFilter === "mind" || user.role === roleFilter; const matchesStatus = !onlyActive || user.status === "Aktív"; const matchesSearch = search.trim().length === 0 || user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase()); return matchesRole && matchesStatus && matchesSearch; }), [roleFilter, onlyActive, search], ); return ( <>
<PageHeader title="Felhasználók és jogosultságok" metaDescription="Admin, elemző és megfigyelő szerepkörök kezelése, lokális prototípus adatforrással." />
<div className="p-4 space-y-4">
<div className="flex justify-end">
<button className="btn btn--sm btn--outline">
<Filter className="mr-2 h-4 w-4 inline" /> Export CSV </button>
</div>
<div className="grid gap-4 md: grid-cols-2 lg, grid-cols-3">
<MetricCard label="Aktív felhasználók" value={'${winmixUserMetrics.active}'} hint="Az elmúlt 24 órában" trend="+4 új belépés" intent="positive" icon={UsersIcon} />
<MetricCard label="Elemzők" value={'${winmixUserMetrics.analysts}'} hint="AI stúdió jogosultsággal" trend="stabil" intent="neutral" />
<MetricCard label="Meghívók" value={'${winmixUserMetrics.invites}'} hint="Küldésre vár" trend="-1 nap" intent="warning" />
</div>
<div className="rounded-3xl border border-white/15 bg-white/5 p-4 backdrop-blur">
<div className="flex flex-col gap-4 lg: flex-row lg, items-center lg:justify-between">
<div className="flex flex-wrap gap-2"> {ROLE_FILTERS.map((filter) => ( <button key={filter.value} className={classNames("btn btn--sm", { "btn--primary": filter.value === roleFilter, "btn--outline": filter.value !== roleFilter, "bg-emerald-500 text-white hover: bg-emerald-600", filter.value === roleFilter, "bg-white/5 text-white/70 hover: bg-white/10 border-transparent", filter.value !== roleFilter })} onClick={() => setRoleFilter(filter.value)} > {filter.label} </button> ))} </div>
<div className="flex flex-col gap-3 sm: flex-row sm, items-center">
<label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
<Switch id="active-switch" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} /> Csak aktív </label>
<div className="relative">
<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Keresés név vagy email alapján" className="field bg-white/5 pl-9 text-white placeholder:text-white/50" style={{ paddingLeft: '2.5rem' }} />
</div>
</div>
</div>
</div>
<div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur overflow-x-auto">
<table className="w-full caption-bottom text-sm text-left">
<thead className="[&_tr]:border-b">
<tr className="border-b border-white/10 transition-colors hover: bg-muted/50 data-[state=selected], bg-muted">
<th className="h-12 px-4 align-middle font-medium text-muted-foreground[&: has([role=checkbox])], pr-0">Név</th>
<th className="h-12 px-4 align-middle font-medium text-muted-foreground[&: has([role=checkbox])], pr-0">Szerepkör</th>
<th className="h-12 px-4 align-middle font-medium text-muted-foreground[&: has([role=checkbox])], pr-0">Szegmensek</th>
<th className="h-12 px-4 align-middle font-medium text-muted-foreground[&: has([role=checkbox])], pr-0">Aktivitás</th>
<th className="h-12 px-4 align-middle font-medium text-muted-foreground[&: has([role=checkbox])], pr-0 text-right">Ország</th>
</tr>
</thead>
<tbody className="[&_tr: last-child], border-0"> {filteredUsers.map((user) => ( <tr key={user.id} className="border-b border-white/5 transition-colors hover: bg-white/5 data-[state=selected], bg-muted">
<td className="p-4 align-middle[&: has([role=checkbox])], pr-0">
<p className="font-semibold text-white">{user.name}</p>
<p className="text-xs text-white/60">{user.email}</p>
</td>
<td className="p-4 align-middle[&: has([role=checkbox])], pr-0">
<Badge className="bg-white/10 text-white"> {user.roleLabel} </Badge>
<div className="text-xs text-white/60 mt-1"> {user.status} • utolsó aktivitás {user.lastSeenMinutes} perce </div>
</td>
<td className="p-4 align-middle[&: has([role=checkbox])], pr-0">
<div className="flex flex-wrap gap-2"> {user.segments.map((segment) => ( <Badge key={segment} className="bg-emerald-500/10 text-emerald-200"> {segment} </Badge> ))} </div>
</td>
<td className="p-4 align-middle[&: has([role=checkbox])], pr-0">
<span className={'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ user.status === "Aktív" ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-500/10 text-amber-200" }'} > {user.status} </span>
</td>
<td className="p-4 align-middle[&: has([role=checkbox])], pr-0 text-right text-white/70">{user.locale}</td>
</tr> ))} </tbody>
</table> {filteredUsers.length === 0 ? ( <div className="px-6 py-8 text-center text-sm text-white/60"> Nincs a szűrőnek megfelelő felhasználó. </div> ) : null} </div>
</div>
</> ); }; export default AdminUsers; 