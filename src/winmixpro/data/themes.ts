export interface WinmixThemePreset {
  id: string;
  name: string;
  description: string;
  accent: string;
  glass: string;
  contrast: string;
  status: "stabil" | "kísérleti";
}
export const winmixThemeLibrary: WinmixThemePreset[] = [{
  id: "theme-aurora",
  name: "Aurora",
  description: "Emerald + indigó átmenet, admin fő téma",
  accent: "from-emerald-400 to-cyan-400",
  glass: "bg-white/10",
  contrast: "sötét",
  status: "stabil"
}, {
  id: "theme-neon",
  name: "Neon Ember",
  description: "Narancs árnyalat, piaci fókuszú lapokhoz",
  accent: "from-orange-400 to-pink-500",
  glass: "bg-white/8",
  contrast: "sötét",
  status: "kísérleti"
}, {
  id: "theme-fjord",
  name: "Fjord",
  description: "Kék-lila gradient, monitoring nézet",
  accent: "from-sky-400 to-indigo-500",
  glass: "bg-white/12",
  contrast: "világos",
  status: "stabil"
}, {
  id: "theme-slate",
  name: "Slate Glow",
  description: "Semleges, audit és riport lapok",
  accent: "from-slate-200 to-slate-50",
  glass: "bg-white/6",
  contrast: "világos",
  status: "kísérleti"
}];