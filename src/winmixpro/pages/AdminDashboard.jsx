import React from 'react';
import { Activity, Database, Target, Users as UsersIcon } from MetricCard from "../../components/MetricCard"; import { useFeatureFlags } from { dashboardKPIs, dashboardMetrics } from "../../data/dashboard";
import PageHeader from "@layout/PageHeader";

const AdminDashboard = () => { const { isEnabled } = useFeatureFlags(); const showAdvancedMetrics = isEnabled("enable-advanced-heatmap"); return ( <>
<PageHeader title="WinmixPro Áttekintő" metaDescription="Központi admin dashboard a teljes rendszer monitorozásához és irányításához." />
<div className="p-4 space-y-4">
<div className="flex justify-end">
<button className="btn btn--sm btn--outline">
<Activity className="mr-2 h-4 w-4 inline" /> Élő nézet </button>
</div>
<div className="grid gap-4 md: grid-cols-2 lg, grid-cols-4">
<MetricCard label={dashboardKPIs[0].label} value={dashboardKPIs[0].value} hint={dashboardKPIs[0].description} trend={dashboardKPIs[0].trend} intent={dashboardKPIs[0].intent} icon={UsersIcon} />
<MetricCard label={dashboardKPIs[1].label} value={dashboardKPIs[1].value} hint={dashboardKPIs[1].description} trend={dashboardKPIs[1].trend} intent={dashboardKPIs[1].intent} icon={Activity} />
<MetricCard label={dashboardKPIs[2].label} value={dashboardKPIs[2].value} hint={dashboardKPIs[2].description} trend={dashboardKPIs[2].trend} intent={dashboardKPIs[2].intent} icon={Target} />
<MetricCard label={dashboardKPIs[3].label} value={dashboardKPIs[3].value} hint={dashboardKPIs[3].description} trend={dashboardKPIs[3].trend} intent={dashboardKPIs[3].intent} icon={Database} />
</div> {showAdvancedMetrics && ( <div className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur">
<h3 className="mb-4 text-lg font-semibold text-white">Haladó metrikák</h3>
<div className="grid gap-4 md:grid-cols-2">
<div>
<p className="text-sm text-white/60">Uptime</p>
<p className="text-2xl font-bold text-white">{dashboardMetrics.uptime}%</p>
</div>
<div>
<p className="text-sm text-white/60">Átlagos válaszidő</p>
<p className="text-2xl font-bold text-white">{dashboardMetrics.avgResponseTime} ms</p>
</div>
</div>
</div> )} <div className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur">
<h3 className="mb-4 text-lg font-semibold text-white">Rendszer összefoglaló</h3>
<div className="space-y-3 text-sm text-white/70">
<p> A WinmixPro platform jelenleg <span className="font-semibold text-white">{dashboardMetrics.totalUsers}</span>{" "} felhasználót szolgál ki, <span className="font-semibold text-white">{dashboardMetrics.activeJobs}</span> aktív feladattal. </p>
<p> Az ML modellek átlagos pontossága{" "} <span className="font-semibold text-emerald-400">{dashboardMetrics.accuracy}%</span>, ami kiemelkedő eredményt jelent az iparágban. </p>
<p> Összesen <span className="font-semibold text-white">{dashboardMetrics.modelsDeployed}</span> modell van telepítve (champion, challenger, shadow kombinációban). </p>
</div>
</div>
</div>
</> ); }; export default AdminDashboard; 