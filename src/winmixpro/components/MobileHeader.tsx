import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WINMIX_PRO_NAV_SECTIONS } from "@/winmixpro/constants";
const WinmixProMobileHeader = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  return <div className="sticky top-0 z-30 border-b border-white/10 bg-black/50 px-4 py-4 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-white/50">WinmixPro</p>
          <p className="text-lg font-semibold text-white">Admin Studio</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-white/30">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] border-white/10 bg-slate-950/95 text-white">
            <SheetHeader>
              <SheetTitle className="text-left text-white">WinmixPro navigáció</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-6 overflow-y-auto pr-3">
              {WINMIX_PRO_NAV_SECTIONS.map(section => <div key={section.title}>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    {section.title}
                  </p>
                  <div className="mt-3 space-y-2">
                    {section.items.map(item => <Link key={item.href} to={item.href} className="flex items-center gap-3 rounded-2xl border border-white/10 px-3 py-3 text-left text-white/70 transition hover:border-white/40 hover:bg-white/5">
                        <span className="rounded-2xl border border-white/20 p-2">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <p className="text-xs text-white/60">{item.description}</p>
                        </div>
                      </Link>)}
                  </div>
                </div>)}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>;
};
export default WinmixProMobileHeader;