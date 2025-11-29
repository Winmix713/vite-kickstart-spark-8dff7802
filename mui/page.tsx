import {
  Search,
  Trophy,
  Bell,
  User,
  Calendar,
  Activity,
  Target,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  Check,
  Cpu,
  Crown,
  Zap,
  Star,
  Clock,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

function UnifiedHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/90 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
        {/* Logo Section */}
        <a href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-bold text-white text-lg leading-tight">Winmix.hu</h1>
            <span className="text-[11px] font-bold text-cyan-400 leading-tight">prediction pro</span>
          </div>
        </a>
        {/* Navigation */}
        <nav className="hidden xl:flex items-center gap-10 text-sm font-medium">
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">
            Home
          </a>
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">
            AI Predictions
          </a>
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">
            Tipster League
          </a>
          <a href="#" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
            <Crown className="w-3.5 h-3.5 text-yellow-500" />
            Premium
          </a>
        </nav>
        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="p-2.5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all">
            <Search className="w-5 h-5" />
          </button>
          <button className="relative p-2.5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all hidden sm:block">
            <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full border-2 border-black animate-pulse" />
            <Bell className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pl-4 ml-2 border-l border-white/10">
            <div className="hidden sm:block text-right">
              <p className="font-semibold text-white text-base">Winmix.hu</p>
              <p className="text-cyan-400 text-xs font-bold leading-3 tracking-tight text-center">prediction pro </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-600 border-2 border-white/20 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function StadiumHero() {
  return (
    <div className="relative w-full aspect-[16/9] lg:aspect-[2.5/1] rounded-3xl border border-white/10 overflow-hidden group shadow-2xl shadow-black/50">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-black/30 mix-blend-overlay" />
      {/* Animated Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-5xl md:text-7xl lg:text-9xl font-black text-white/[0.03] tracking-tighter select-none">
          LIVE ARENA
        </h1>
      </div>
      {/* Top Controls */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-3 z-10">
        <div className="flex bg-black/60 backdrop-blur-xl rounded-xl p-1.5 border border-white/10 shadow-lg">
          <button className="flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-xs font-bold text-white shadow-lg shadow-cyan-900/30 hover:shadow-cyan-900/50 transition-all">
            <Calendar className="w-4 h-4" />
            Matches
          </button>
          <button className="flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-lg text-zinc-400 text-xs font-semibold hover:text-white hover:bg-white/5 transition-all">
            <Activity className="w-4 h-4" />
            Analysis
          </button>
        </div>
      </div>
      {/* Enhanced Floating Stats Card */}
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-10 md:bottom-10 md:w-[500px] z-20">
        <div className="bg-black/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl shadow-lg shadow-cyan-900/30">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Live Analysis</h3>
                <p className="text-xs text-zinc-400 font-medium">Real-time predictions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-emerald-400">LIVE</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4 sm:mb-6">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-white mb-1">94%</p>
              <p className="text-xs text-zinc-500 font-medium">Accuracy</p>
            </div>
            <div className="text-center border-x border-white/10">
              <p className="text-xl sm:text-2xl font-bold text-cyan-400 mb-1">12</p>
              <p className="text-xs text-zinc-500 font-medium">Active</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-white mb-1">€2.4K</p>
              <p className="text-xs text-zinc-500 font-medium">Today</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-5 border-t border-white/10 gap-4">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-semibold">Protected Betting</span>
            </div>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-900/30 hover:shadow-cyan-900/50 group">
              Start Now
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeamTicker() {
  const teams = [
    {
      code: "MCI",
      name: "Manchester City",
      points: 28,
      trend: "+2",
      color: "from-blue-600 to-blue-800",
    },
    {
      code: "ARS",
      name: "Arsenal",
      points: 26,
      trend: "+1",
      color: "from-red-600 to-red-800",
      active: true,
    },
    {
      code: "LIV",
      name: "Liverpool",
      points: 25,
      trend: "0",
      color: "from-red-700 to-red-900",
    },
    {
      code: "AVL",
      name: "Aston Villa",
      points: 24,
      trend: "-1",
      color: "from-purple-600 to-purple-800",
    },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {teams.map((team) => (
        <div
          key={team.code}
          className={`
            relative group rounded-2xl p-6 transition-all cursor-pointer border
            ${
              team.active
                ? "bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border-cyan-500/30 shadow-lg shadow-cyan-900/20"
                : "bg-zinc-900/30 border-white/10 hover:bg-zinc-900/50 hover:border-white/20"
            }
          `}
        >
          {team.active && (
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 blur-2xl pointer-events-none rounded-2xl" />
          )}
          <div className="relative z-10 flex items-center gap-5">
            <div
              className={`
                w-14 h-14 rounded-xl flex items-center justify-center text-xs font-black border-2 shadow-lg
                ${
                  team.active
                    ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white border-cyan-400/30 shadow-cyan-900/30"
                    : "bg-zinc-800/50 text-zinc-400 border-zinc-700/50"
                }
              `}
            >
              {team.code}
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-white mb-1">{team.name}</h4>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">{team.points} pts</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    team.trend.startsWith("+")
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : team.trend.startsWith("-")
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                  }`}
                >
                  {team.trend}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatsBento() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* AI Confidence Card - Enhanced */}
      <div className="overflow-hidden group bg-[#70E1F5] w-full bg-[url(/placeholder.svg?height=400&width=600&query=stadium)] bg-cover bg-center rounded-[32px] p-6 relative shadow-[0_10px_40px_-10px_rgba(112,225,245,0.3)]">
        {/* Decorative Background Elements */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -left-10 bottom-0 bg-blue-500/20 w-32 h-32 rounded-full blur-2xl" />

        <div className="relative z-20 flex justify-between items-start">
          <div>
            <div className="inline-flex bg-slate-50/10 rounded-full mb-2 px-2.5 py-1 backdrop-blur-sm gap-1.5 items-center">
              <ShieldCheck className="w-4 h-4 text-slate-50" />
              <span className="text-[10px] uppercase font-bold text-slate-50 tracking-wide">Excellent</span>
            </div>
            <h2 className="text-5xl text-slate-50 tracking-tighter font-semibold">784</h2>
          </div>
          <div className="flex text-black bg-slate-950/20 w-10 h-10 rounded-full backdrop-blur-md items-center justify-center">
            <TrendingUp className="w-4 h-4 text-slate-50" />
          </div>
        </div>

        <div className="relative z-20 mt-6">
          {/* Custom Sparkline SVG */}
          <svg className="w-full h-12 text-slate-50" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path
              d="M0,25 C10,25 10,10 20,15 C30,20 30,5 40,10 C50,15 50,25 60,20 C70,15 70,5 80,10 C90,15 90,0 100,5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
          </svg>
          <div className="flex justify-between items-center mt-2">
            <p className="text-[11px] font-bold text-slate-50/70">+12 pts from last month</p>
            <ArrowRight className="w-4 h-4 text-slate-50" />
          </div>
        </div>
      </div>

      {/* Weekly Performance - Refactored Light Design */}
      <div className="bg-white rounded-[20px] border border-white shadow-[0px_34px_24px_-20px_rgba(141,157,173,0.3)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-[#2A3F5E]/30">
          <h3 className="text-sm text-[#2A3F5E] font-normal">Profile activity</h3>
          <div className="flex items-center gap-1">
            <div className="w-0.5 h-0.5 rounded-full bg-[#2A3F5E]" />
            <div className="w-0.5 h-0.5 rounded-full bg-[#2A3F5E]" />
            <div className="w-0.5 h-0.5 rounded-full bg-[#2A3F5E]" />
          </div>
        </div>
        {/* Stats Section */}
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-[36px] leading-[53px] font-medium text-black">2.6k</h2>
            <p className="text-sm leading-4 text-[#2A3F5E] max-w-[131px]">People watched your videos today</p>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[10px] leading-3 text-[#1FBC9A] font-medium">+4.2%</div>
            <div className="flex items-end gap-[3px] h-8">
              {[40, 65, 85, 50, 30, 70, 45].map((h, i) => (
                <div
                  key={i}
                  className={`w-[5px] rounded-[1px] ${i === 2 ? "bg-[#1FBC9A]" : "bg-[#DDE2E8]"}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Graph Section */}
        <div className="px-5 pb-5">
          <div className="h-[120px] w-full relative">
            <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,100 C50,80 80,110 120,60 S200,80 300,40"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M0,100 C50,80 80,110 120,60 S200,80 300,40 V120 H0 Z"
                fill="url(#purpleGradient)"
                opacity="0.5"
              />
            </svg>
            {/* Tooltip */}
            <div className="absolute top-[40%] left-[45%] bg-[#2A3F5E] text-white text-xs px-2 py-1 rounded shadow-lg transform -translate-x-1/2 -translate-y-full">
              450
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#2A3F5E]" />
            </div>
            <div className="absolute top-[40%] left-[45%] w-2 h-2 bg-white border-2 border-[#4F46E5] rounded-full transform -translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-[#8D9DAD] font-medium uppercase">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FiveDayOutlook() {
  const days = [
    { day: "Tue", temp: "85%", status: "High", icon: "sun", color: "amber" },
    { day: "Wed", temp: "78%", status: "Good", icon: "cloud-sun", color: "sky" },
    { day: "Thu", temp: "65%", status: "Medium", icon: "cloud", color: "neutral" },
    { day: "Fri", temp: "82%", status: "High", icon: "sun", color: "amber" },
    { day: "Sat", temp: "90%", status: "Peak", icon: "sun", color: "emerald" },
  ]

  return (
    <section className="bg-neutral-900 border border-white/10 rounded-3xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">5-day outlook</p>
          <p className="text-sm font-medium tracking-tight text-neutral-100">Prediction confidence forecast</p>
        </div>
        <button className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-1 text-[11px] text-neutral-100 hover:bg-neutral-700 hover:border-white/20 transition border border-white/10">
          <Target className="h-3.5 w-3.5" />
          Premier League
        </button>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {days.map((day, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-2xl bg-neutral-800/80 px-2 py-3 border border-white/10"
          >
            <p className="text-xs text-neutral-300 mb-1">{day.day}</p>
            <div className="flex items-center justify-center mb-1">
              {day.icon === "sun" && (
                <svg className="w-5 h-5 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="5" />
                  <path
                    d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              )}
              {day.icon === "cloud" && (
                <svg className="w-5 h-5 text-neutral-100" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.5 19A5.5 5.5 0 1 1 9 8.5a6.5 6.5 0 1 1 11 6 2 2 0 0 1-2 2H6.5z" />
                </svg>
              )}
              {day.icon === "cloud-sun" && (
                <svg className="w-5 h-5 text-amber-200" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M6 19a5 5 0 1 1 2-9 6 6 0 1 1 10 5H6z" opacity="0.7" />
                </svg>
              )}
            </div>
            <p className="text-xs font-medium text-neutral-100 mb-1">{day.temp}</p>
            <span
              className={`text-[10px] ${day.color === "emerald" ? "text-emerald-300" : day.color === "amber" ? "text-amber-300" : "text-sky-300"}`}
            >
              {day.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ControlPanel() {
  return (
    <div className="space-y-4">
      <div className="bg-black border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">Active Models</h3>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Nexus-AI v2.1</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Active
              </span>
              <span className="text-zinc-600 font-mono">2m ago</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Oracle-X</span>
            <div className="flex items-center gap-3">
              <span className="text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Computing
              </span>
              <span className="text-zinc-600 font-mono">45s ago</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Vanguard-Pro</span>
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 font-bold bg-zinc-800 px-2 py-0.5 rounded border border-white/10">
                Waiting
              </span>
              <span className="text-zinc-600 font-mono">5m ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Card (Last 30 Days) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 to-black border border-white/10 p-5 shadow-xl">
        {/* Header Labels */}
        <div className="absolute top-4 left-4">
          <p className="text-[11px] font-normal tracking-[0.02em] text-[#9FAEC4] mb-2">LAST 30 DAYS</p>
          <p className="text-[18px] font-normal text-white">+1.367 views</p>
        </div>
        <div className="absolute top-4 right-4">
          <p className="text-[14px] font-normal text-[#22E341]">+13%</p>
        </div>

        {/* Chart Area with Gradient Fill */}
        <svg className="absolute bottom-0 left-0 w-full h-[76px]" viewBox="0 0 254 76" preserveAspectRatio="none">
          {/* Gradient Fill */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="23.08%" stopColor="rgba(43, 63, 242, 0.25)" />
              <stop offset="100%" stopColor="rgba(43, 63, 242, 0)" />
            </linearGradient>
          </defs>

          {/* Area path */}
          <path
            d="M 0 50 Q 20 35, 40 40 T 80 30 Q 100 25, 120 35 T 160 25 Q 180 20, 200 15 L 230 20 L 240 25 L 254 76 L 0 76 Z"
            fill="url(#chartGradient)"
          />

          {/* Line path */}
          <path
            d="M 0 50 Q 20 35, 40 40 T 80 30 Q 100 25, 120 35 T 160 25 Q 180 20, 200 15 L 230 20 L 240 25"
            fill="none"
            stroke="#2B3FF2"
            strokeWidth="2"
          />

          {/* Dot at peak */}
          <circle cx="200" cy="15" r="3" fill="#1A2028" stroke="#2B3FF2" strokeWidth="2" />
        </svg>
      </div>

      {/* Summary Stats Card */}
      <div className="relative w-full h-[74px] bg-[#1A2028] border border-[#2C323C] rounded-[10px] p-4">
        {/* Stats Grid */}
        <div className="flex items-center justify-between h-full">
          {/* Posts */}
          <div className="flex flex-col items-center flex-1">
            <p className="text-[18px] font-normal text-white mb-1">12</p>
            <p className="text-[11px] font-normal tracking-[0.02em] text-[#9FAEC4]">POSTS</p>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-[#3F526D] opacity-50" />

          {/* Views */}
          <div className="flex flex-col items-center flex-1">
            <p className="text-[18px] font-normal text-white mb-1">+13%</p>
            <p className="text-[11px] font-normal tracking-[0.02em] text-[#9FAEC4]">VIEWS</p>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-[#3F526D] opacity-50" />

          {/* Fans */}
          <div className="flex flex-col items-center flex-1">
            <p className="text-[18px] font-normal text-white mb-1">23</p>
            <p className="text-[11px] font-normal tracking-[0.02em] text-[#9FAEC4]">FANS</p>
          </div>
        </div>

        {/* Badge */}
        <div className="absolute right-3 bottom-2">
          <div className="px-2 py-1 bg-[#2B3FF2] rounded-[30px]">
            <p className="text-[11px] font-medium tracking-[0.07em] text-white">THIS WEEK</p>
          </div>
        </div>
      </div>

      <div className="bg-black border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white text-sm">Premier League</h3>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 px-2">
            <span className="w-4">#</span>
            <span className="flex-1">Club</span>
            <span className="w-12 text-center">Form</span>
            <span className="w-6 text-right">Pts</span>
          </div>

          {[
            { rank: 1, name: "Man City", pts: 24, form: ["w", "w", "w"] },
            { rank: 2, name: "Arsenal", pts: 18, form: ["l", "w", "w"] },
            { rank: 3, name: "Liverpool", pts: 15, form: ["w", "d", "w"] },
            { rank: 4, name: "Spurs", pts: 14, form: ["l", "l", "w"] },
            { rank: 5, name: "Man Utd", pts: 14, form: ["l", "l", "d"] },
          ].map((team) => (
            <div
              key={team.name}
              className="flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
            >
              <span className="w-4 font-bold text-white">{team.rank}</span>
              <span className="flex-1 font-medium text-zinc-300">{team.name}</span>
              <div className="w-12 flex justify-center gap-1">
                {team.form.map((result, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      result === "w" ? "bg-emerald-500" : result === "l" ? "bg-red-500" : "bg-zinc-500"
                    }`}
                  />
                ))}
              </div>
              <span className="w-6 text-right font-bold text-white">{team.pts}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-black border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <h3 className="font-bold text-white text-sm">Heti Hozam</h3>
          </div>
          <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            Live
          </span>
        </div>

        <div className="text-center mb-8 relative z-10">
          <p className="text-xs font-medium text-zinc-400 mb-1">Total This Week</p>
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-4xl font-black text-white tracking-tight">€847</h2>
            <span className="text-xs font-bold text-black bg-teal-400 px-2 py-1 rounded-full shadow-[0_0_10px_rgba(45,212,191,0.4)]">
              +24%
            </span>
          </div>
        </div>

        <div className="space-y-4 mb-6 relative z-10">
          {[
            { day: "Hétfő", val: 142, max: 200 },
            { day: "Kedd", val: 189, max: 200 },
            { day: "Szerda", val: 156, max: 200, today: true },
            { day: "Csütörtök", val: 178, max: 200 },
            { day: "Péntek", val: 182, max: 200 },
          ].map((item) => (
            <div key={item.day} className="space-y-1">
              <div className="flex justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={item.today ? "text-white font-bold" : "text-zinc-500"}>{item.day}</span>
                  {item.today && (
                    <span className="text-[9px] bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded font-bold border border-teal-500/20">
                      Today
                    </span>
                  )}
                </div>
                <span className="text-white font-bold">€{item.val}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.today ? "bg-gradient-to-r from-teal-400 to-cyan-400" : "bg-teal-900/40"
                  }`}
                  style={{ width: `${(item.val / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-white/5 relative z-10">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-zinc-400">Heti Cél</span>
            <span className="text-white font-bold">
              €847 <span className="text-zinc-600">/ €1000</span>
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full w-[84.7%] bg-gradient-to-r from-teal-400 to-cyan-500 shadow-[0_0_10px_rgba(45,212,191,0.3)]" />
          </div>
          <p className="text-[10px] text-center text-zinc-500 mt-2">84.7% of weekly target reached</p>
        </div>
      </div>

      {/* Premium CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 p-5 group cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 group-hover:from-yellow-600/30 group-hover:to-amber-600/30 transition-colors" />
        <div className="absolute inset-0 border border-yellow-500/30 rounded-xl" />
        <div className="relative p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-yellow-500 mb-0.5 flex items-center gap-1.5">
              <Crown className="w-3 h-3 fill-yellow-500" />
              Upgrade to Pro
            </p>
            <p className="text-[10px] text-yellow-200/70">Unlock all premium models</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 group-hover:scale-110 transition-transform">
            <ArrowRight className="w-3 h-3 text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

function FiltersSidebar() {
  return (
    <div className="w-full lg:w-72 space-y-8 flex-shrink-0">
      <div className="bg-black border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white text-sm">Filters</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-400">Min Confidence</span>
              <span className="text-cyan-400">85%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full w-[85%] bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <Trophy className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium text-white">Premier League</span>
              </div>
              <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="flex items-center justify-between group cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Star className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium text-zinc-400 group-hover:text-white">La Liga</span>
              </div>
              <div className="w-5 h-5 rounded border border-white/20" />
            </div>
          </div>
        </div>
      </div>

      <ControlPanel />
      <WeeklyPerformanceChart />
    </div>
  )
}

function WeeklyPerformanceChart() {
  // Dummy component, as the actual component was not provided in the original code.
  // This is a placeholder to satisfy the dependency in FiltersSidebar.
  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4">
      <h3 className="text-sm font-bold text-white mb-3">Weekly Performance</h3>
      <div className="flex items-center justify-center h-24">
        <p className="text-zinc-500 text-xs">Weekly Performance Chart Placeholder</p>
      </div>
    </div>
  )
}

function MatchGrid() {
  const matches = [
    {
      id: 1,
      league: "Premier League",
      home: "Man City",
      away: "Liverpool",
      time: "20:45",
      odds: { home: 2.1, draw: 3.4, away: 2.8 },
      prediction: "Home Win",
      confidence: 88,
      status: "Live",
    },
    {
      id: 2,
      league: "La Liga",
      home: "Real Madrid",
      away: "Barcelona",
      time: "21:00",
      odds: { home: 1.95, draw: 3.6, away: 3.1 },
      prediction: "Over 2.5",
      confidence: 92,
      status: "Upcoming",
    },
    {
      id: 3,
      league: "Serie A",
      home: "Juventus",
      away: "AC Milan",
      time: "18:30",
      odds: { home: 2.4, draw: 3.1, away: 2.9 },
      prediction: "BTTS",
      confidence: 75,
      status: "Upcoming",
    },
    {
      id: 4,
      league: "Bundesliga",
      home: "Bayern",
      away: "Dortmund",
      time: "15:30",
      odds: { home: 1.6, draw: 4.2, away: 4.8 },
      prediction: "Home -1.5",
      confidence: 85,
      status: "Upcoming",
    },
  ]

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Calendar className="w-6 h-6 text-cyan-400" />
          Featured Matches
        </h2>
        <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
          <button className="px-4 py-1.5 rounded-md bg-white/10 text-xs font-bold text-white">All</button>
          <button className="px-4 py-1.5 rounded-md text-xs font-bold text-zinc-400 hover:text-white transition-colors">
            Live
          </button>
          <button className="px-4 py-1.5 rounded-md text-xs font-bold text-zinc-400 hover:text-white transition-colors">
            Upcoming
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="group relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300"
          >
            {/* Status Strip */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="p-5">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{match.league}</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/10">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  <span className="text-xs font-mono text-zinc-300">{match.time}</span>
                </div>
              </div>

              {/* Teams */}
              <div className="flex justify-between items-center mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center font-bold text-zinc-500 group-hover:border-white/20 group-hover:text-white transition-colors">
                    {match.home.substring(0, 1)}
                  </div>
                  <span className="text-sm font-bold text-white">{match.home}</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xl font-black text-zinc-700 group-hover:text-white/20 transition-colors">
                    VS
                  </span>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center font-bold text-zinc-500 group-hover:border-white/20 group-hover:text-white transition-colors">
                    {match.away.substring(0, 1)}
                  </div>
                  <span className="text-sm font-bold text-white">{match.away}</span>
                </div>
              </div>

              {/* Odds Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">1</div>
                  <div className="text-sm font-bold text-white">{match.odds.home}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">X</div>
                  <div className="text-sm font-bold text-white">{match.odds.draw}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">2</div>
                  <div className="text-sm font-bold text-white">{match.odds.away}</div>
                </div>
              </div>

              {/* AI Prediction Footer */}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-yellow-500 uppercase">AI Prediction</span>
                  </div>
                  <span className="text-sm font-bold text-white">{match.prediction}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 font-bold block mb-1">CONFIDENCE</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                        style={{ width: `${match.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-yellow-400">{match.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureHeroSection() {
  return (
    <section className="relative z-10 pt-24 pb-12">
      <section className="max-w-7xl mx-auto p-8 rounded-3xl bg-gradient-to-br from-white/0 via-white/10 to-white/0 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 px-6">
          <div className="text-left">
            <h2 className="text-base font-semibold text-sky-400">Advanced Analytics</h2>
            <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mt-3">
              Powerful tools for smart betting
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mt-4">
              Track performance, forecast outcomes, and optimize your strategy—WinMix keeps everything in one clear
              view.
            </p>
          </div>

          {/* Feature tabs */}
          <div className="mt-8 md:mt-0">
            <div className="inline-flex border border-white/10 rounded-xl p-1">
              <button className="px-4 py-2 text-sm font-medium rounded-lg transition bg-sky-500/20 text-sky-200 ring-1 ring-inset ring-sky-500/30">
                Overview
              </button>
              <button className="px-4 py-2 text-sm font-medium rounded-lg transition text-white/80 hover:text-white">
                AI Models
              </button>
              <button className="px-4 py-2 text-sm font-medium rounded-lg transition text-white/80 hover:text-white">
                Analytics
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Highlighted Feature */}
          <div className="lg:col-span-5 overflow-hidden rounded-3xl border border-white/10 p-8 relative backdrop-blur-xl">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.02] via-white/[0.03] to-white/[0.02]" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(1000px 500px at 10% 0%, rgba(14,165,233,0.12), transparent 60%)",
              }}
            />

            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Bet smarter with real-time predictions
            </h3>
            <p className="mt-3 text-white/70 leading-7">
              AI-powered analysis, live odds tracking, and smart alerts help you make confident decisions.
            </p>

            {/* Bullet points */}
            <ul className="mt-6 space-y-3">
              {[
                "Live match analysis & confidence scores",
                "Historical performance tracking",
                "Smart bankroll management",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/20 ring-1 ring-sky-500/30">
                    <Check className="h-3.5 w-3.5 text-sky-300" />
                  </span>
                  <p className="text-sm text-white/80">{item}</p>
                </li>
              ))}
            </ul>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <div className="text-4xl font-semibold tracking-tight text-white">94%</div>
                <p className="text-sm text-white/60 mt-2">Prediction accuracy</p>
              </div>
              <div>
                <div className="text-4xl font-semibold tracking-tight text-white">€2.4K</div>
                <p className="text-sm text-white/60 mt-2">Avg weekly profit</p>
              </div>
            </div>
          </div>

          {/* Right: Preview Dashboard */}
          <div className="lg:col-span-7 overflow-hidden rounded-3xl border border-white/10 p-4 relative backdrop-blur-xl">
            {/* Top bar */}
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-sky-500/15 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-sky-400" />
                </div>
                <span className="text-sm font-medium text-slate-200">WinMix Pro</span>
              </div>
              <div className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-slate-400">
                Live predictions enabled
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: "Win Rate", value: "87%", change: "+5.2%", icon: Target },
                { label: "Profit", value: "€2,450", change: "+12.4%", icon: TrendingUp },
                { label: "Active Bets", value: "8", change: "Live", icon: Activity },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="h-7 w-7 rounded-lg bg-sky-500/15 flex items-center justify-center">
                      <stat.icon className="h-4 w-4 text-sky-400" />
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400">{stat.label}</div>
                  <div className="text-xl font-semibold text-white tracking-tight">{stat.value}</div>
                  <div className="text-[10px] text-sky-400">{stat.change}</div>
                </div>
              ))}
            </div>

            {/* Analysis row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Bars */}
              <div className="lg:col-span-2 rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-300">Weekly Performance</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">Last 7 Days</span>
                </div>
                <div className="grid grid-cols-12 gap-2 h-24 items-end">
                  {[6, 10, 8, 12, 9, 7, 6, 24, 10, 7, 16, 20].map((h, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded",
                        i === 7 ? "bg-sky-500/70 shadow-[0_0_20px_rgba(56,189,248,0.45)]" : "bg-white/10",
                      )}
                      style={{ height: `${h * 4}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Donut */}
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="-rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      className="text-sky-400"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset="75"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-semibold tracking-tight text-white">87%</div>
                      <div className="text-[10px] text-slate-400">Win Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  )
}

export default function WinMixTipsterPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-cyan-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />

      <UnifiedHeader />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <StadiumHero />

        <div className="flex flex-col lg:flex-row gap-8">
          <FiltersSidebar />

          <div className="flex-1 space-y-8 min-w-0">
            <StatsBento />
            <FiveDayOutlook />
            <TeamTicker />
            <MatchGrid />
          </div>
        </div>

        <FeatureHeroSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl mt-20">
        <div className="max-w-[1600px] mx-auto px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">WINMIX</span>
              </div>
              <p className="text-sm text-zinc-500">
                Professional sports analytics and AI-driven predictions for serious bettors.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Live Analysis</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">AI Models</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Tipster League</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Pricing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Help Center</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Terms of Service</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Contact Us</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Newsletter</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors w-full"
                />
                <button className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 flex items-center justify-between text-xs text-zinc-600">
            <p>© 2025 WINMIX Tipster Pro. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
              <span className="hover:text-white cursor-pointer transition-colors">Discord</span>
              <span className="hover:text-white cursor-pointer transition-colors">Instagram</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
