import { Trophy, ArrowUpRight } from "lucide-react";
const TopPredictions = () => {
  const topUsers = [{
    name: "FociBajnok22",
    score: 1250,
    accuracy: "83%",
    streak: 7
  }, {
    name: "MesterTippelo",
    score: 1120,
    accuracy: "79%",
    streak: 5
  }, {
    name: "Prediktátor",
    score: 980,
    accuracy: "74%",
    streak: 3
  }, {
    name: "SportGuru",
    score: 870,
    accuracy: "71%",
    streak: 2
  }, {
    name: "BajnokTipp",
    score: 790,
    accuracy: "68%",
    streak: 4
  }];
  return <div className="rounded-3xl bg-card ring-1 ring-border p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-xl tracking-tight text-foreground font-semibold">Legjobb Tippelők</h3>
        </div>
        <span className="text-xs text-muted-foreground">Frissítés óránként</span>
      </div>
      <div className="mt-5 rounded-xl overflow-hidden ring-1 ring-border">
        <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-card text-[11px] text-muted-foreground">
          <span>#</span><span>Felhasználó</span><span>Pontszám</span><span>Pontosság</span><span>Széria</span>
        </div>
        <ul className="divide-y divide-border">
          {topUsers.map((user, index) => <li key={index} className="px-3 py-3 hover:bg-muted transition">
              <div className="grid grid-cols-5 items-center gap-2">
                <span className="text-xs text-muted-foreground">{index + 1}</span>
                <div className="flex items-center gap-2">
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.name}`} alt="avatar" className="h-6 w-6 rounded-sm ring-1 ring-border" />
                  <span className="text-sm text-foreground font-semibold">{user.name}</span>
                </div>
                <span className="text-sm text-secondary font-semibold">{user.score}</span>
                <span className="text-sm text-primary">{user.accuracy}</span>
                <span className="inline-flex items-center gap-1 text-sm text-primary">
                  <ArrowUpRight className="w-4 h-4" />{user.streak}
                </span>
              </div>
            </li>)}
        </ul>
      </div>
    </div>;
};
export default TopPredictions;