import { Sparkles, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import TopPredictions from "./TopPredictions";
const CallToAction = () => {
  return <section id="call-to-action" className="scroll-mt-24 ml-0 md:ml-[84px] py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* CTA / Results Panel */}
          <div className="lg:col-span-3 rounded-3xl bg-card ring-1 ring-border p-5 sm:p-6 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/70 via-primary/70 to-primary/70"></div>

            {/* State: Empty */}
            <div id="cta-empty">
              <div className="flex items-center gap-2 text-xs rounded-full px-2.5 py-1 ring-1 ring-border bg-card w-fit">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground font-semibold">Emeld szintre tippelési élményed</span>
              </div>
              <div className="mt-4">
                <h3 className="text-xl tracking-tight text-foreground font-semibold">Készen állsz tesztelni előrejelzési képességeidet?</h3>
                <p className="text-muted-foreground text-sm mt-1">Hozz létre fiókot, böngéssz mérkőzéseket és csatlakozz az exkluzív tippversenyekhez.</p>
              </div>

              <ul className="mt-5 space-y-3">
                {["Hozzáférés az összes előrejelzési funkcióhoz", "Csatlakozás exkluzív tippversenyekhez", "Teljesítményed követése részletes analitikákkal", "Versenyezz jutalmakért és díjakért"].map((benefit, index) => <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <span className="text-muted-foreground text-sm">{benefit}</span>
                  </li>)}
              </ul>

              <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button className="relative group overflow-hidden inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-gradient-to-r from-primary to-primary text-primary-foreground ring-1 ring-primary hover:ring-primary/80 transition text-sm font-semibold">
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ingyenes fiók létrehozása
                  </span>
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 bg-gradient-to-r from-white/0 via-white/40 to-white/0"></span>
                </Button>
                <a href="#match-selection" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-card ring-1 ring-border hover:bg-muted hover:ring-primary/30 transition text-sm">
                  <Calendar className="w-4 h-4" />
                  Mérkőzések böngészése
                </a>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <aside id="leaderboard" className="lg:col-span-2">
            <TopPredictions />
          </aside>
        </div>
      </div>
    </section>;
};
export default CallToAction;