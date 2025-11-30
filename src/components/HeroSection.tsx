import { ChevronRight, Radar, Wifi, Sparkles, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import ControlPanel from "./ControlPanel";
import stadiumImage from "@/assets/stadium-champions-league.jpg";
import manCityLogo from "@/assets/team-logo-mancity.png";
import arsenalLogo from "@/assets/team-logo-arsenal.png";
import liverpoolLogo from "@/assets/team-logo-liverpool.png";
import villaLogo from "@/assets/team-logo-villa.png";
const HeroSection = () => {
  return <section id="hero" className="relative ml-0 md:ml-[84px]">
      {/* Global background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_30%,rgba(255,115,50,0.20),transparent_60%),radial-gradient(70%_60%_at_80%_70%,rgba(16,185,129,0.12),transparent_55%),linear-gradient(to-b,#0b0b0f,#000)]"></div>
        
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.3)_1px,transparent_1px)] bg-[length:72px_72px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,black,transparent)]"></div>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-10 w-[36rem] h-[36rem] bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 right-0 w-[28rem] h-[28rem] bg-primary/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Centerpiece: 3D render with overlay stats */}
          <div className="lg:col-span-2 relative">
            <div className="relative overflow-hidden rounded-3xl ring-1 ring-border bg-card">
              <img src={stadiumImage} alt="UEFA Champions League stadium with dramatic lighting and crowd" className="w-full h-[440px] sm:h-[520px] object-cover opacity-[0.92]" />
              <div className="absolute inset-0 bg-gradient-to-tr from-background/50 via-background/10 to-transparent"></div>
              
              {/* Floating card pack */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-[92%] sm:w-[80%] max-w-xl">
                <div className="rounded-2xl bg-background/60 backdrop-blur ring-1 ring-border p-4 shadow-2xl">
                  {/* Card header */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                      <Radar className="w-5 h-5 text-primary" />
                      <span className="text-foreground text-sm tracking-tight font-semibold">Élő mérkőzés elemzés</span>
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Wifi className="w-4 h-4" /> Valós idő
                    </div>
                  </div>
                  
                  {/* Two stacked metric rows */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Probability */}
                    <div className="rounded-xl bg-card ring-1 ring-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-secondary" />
                          <span className="text-sm text-foreground font-semibold">Győzelmi esély</span>
                        </div>
                        <span className="text-sm text-secondary font-semibold">22%</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {[...Array(10)].map((_, i) => <span key={i} className={`h-2 w-2 rounded-full ${i < 3 ? 'bg-secondary/70' : 'bg-secondary/10'}`} />)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-2">Optimális: 35–65%</div>
                    </div>
                    
                    {/* Value edge */}
                    <div className="rounded-xl bg-card ring-1 ring-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground font-semibold">Value edge</span>
                        </div>
                        <span className="text-sm text-primary font-semibold">55%</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {[...Array(10)].map((_, i) => <span key={i} className={`h-2 w-2 rounded-full ${i < 5 ? 'bg-primary/70' : 'bg-primary/10'}`} />)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-2">Optimális: 40–60%</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4" />
                      Kockázatkezelés aktív
                    </div>
                    <Link to="/predictions/new" className="w-auto">
                      <Button className="inline-flex items-center gap-2 h-9 px-3">
                        Kezdj tippelni
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom team form cards */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[{
              name: "Manchester City",
              logo: manCityLogo,
              form: ["W", "W", "W", "D", "W"],
              points: 28
            }, {
              name: "Arsenal",
              logo: arsenalLogo,
              form: ["W", "W", "L", "W", "W"],
              points: 26
            }, {
              name: "Liverpool",
              logo: liverpoolLogo,
              form: ["W", "D", "W", "W", "L"],
              points: 25
            }, {
              name: "Aston Villa",
              logo: villaLogo,
              form: ["L", "W", "W", "D", "W"],
              points: 24
            }].map((team, i) => <div key={i} className="rounded-2xl bg-card ring-1 ring-border px-3 py-3 flex items-center gap-3">
                  <img src={team.logo} alt={`${team.name} logo`} className="h-10 w-10 rounded-full ring-1 ring-border object-cover bg-background p-1" />
                  <div className="flex-1">
                    <div className="text-sm text-foreground tracking-tight font-semibold">{team.name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {team.form.map((result, idx) => <span key={idx} className={`h-1.5 w-1.5 rounded-full ${result === "W" ? "bg-primary" : result === "D" ? "bg-secondary" : "bg-destructive"}`} title={result === "W" ? "Győzelem" : result === "D" ? "Döntetlen" : "Vereség"} />)}
                      <span className="text-xs text-muted-foreground ml-1">{team.points} pont</span>
                    </div>
                  </div>
                </div>)}
            </div>
          </div>

          {/* Right control panel */}
          <ControlPanel />
        </div>
      </div>
    </section>;
};
export default HeroSection;