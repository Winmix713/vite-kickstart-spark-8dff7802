export interface WinmixUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "elemzo" | "megfigyelo";
  roleLabel: string;
  status: "Aktív" | "Szunnyadó" | "Meghívott";
  lastSeenMinutes: number;
  segments: string[];
  locale: string;
}
export const winmixUserMetrics = {
  active: 18,
  analysts: 7,
  invites: 3
};
export const winmixUsers: WinmixUser[] = [{
  id: "usr-1001",
  name: "Kovács Lilla",
  email: "lilla.kovacs@winmix.hu",
  role: "admin",
  roleLabel: "Admin",
  status: "Aktív",
  lastSeenMinutes: 4,
  segments: ["Premier League", "Piaci overlay"],
  locale: "HU"
}, {
  id: "usr-1002",
  name: "Szabó Márton",
  email: "marton.szabo@winmix.hu",
  role: "elemzo",
  roleLabel: "Elemző",
  status: "Aktív",
  lastSeenMinutes: 11,
  segments: ["Serie A", "Fázis 9"],
  locale: "HU"
}, {
  id: "usr-1003",
  name: "Farkas Petra",
  email: "petra.farkas@winmix.hu",
  role: "megfigyelo",
  roleLabel: "Megfigyelő",
  status: "Szunnyadó",
  lastSeenMinutes: 1380,
  segments: ["Bundesliga"],
  locale: "DE"
}, {
  id: "usr-1004",
  name: "Horváth Ákos",
  email: "akos.horvath@winmix.hu",
  role: "elemzo",
  roleLabel: "Elemző",
  status: "Aktív",
  lastSeenMinutes: 26,
  segments: ["NB I", "Ifjúsági"],
  locale: "HU"
}, {
  id: "usr-1005",
  name: "Tóth Nóra",
  email: "nora.toth@winmix.hu",
  role: "admin",
  roleLabel: "Admin",
  status: "Meghívott",
  lastSeenMinutes: 0,
  segments: ["Integrációk"],
  locale: "EN"
}, {
  id: "usr-1006",
  name: "Varga Sándor",
  email: "sandor.varga@winmix.hu",
  role: "elemzo",
  roleLabel: "Elemző",
  status: "Aktív",
  lastSeenMinutes: 42,
  segments: ["Market intelligence"],
  locale: "HU"
}, {
  id: "usr-1007",
  name: "Pap Eszter",
  email: "eszter.pap@winmix.hu",
  role: "megfigyelo",
  roleLabel: "Megfigyelő",
  status: "Aktív",
  lastSeenMinutes: 68,
  segments: ["Women Champions League"],
  locale: "EN"
}, {
  id: "usr-1008",
  name: "Balogh Levente",
  email: "levente.balogh@winmix.hu",
  role: "elemzo",
  roleLabel: "Elemző",
  status: "Aktív",
  lastSeenMinutes: 7,
  segments: ["Adatminőség"],
  locale: "HU"
}];