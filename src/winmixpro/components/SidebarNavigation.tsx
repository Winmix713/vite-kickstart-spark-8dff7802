import { NavLink } from "react-router-dom";
import { WINMIX_PRO_NAV_SECTIONS } from "@/winmixpro/constants";
const baseClasses = "flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left transition focus-visible:outline-none";
const WinmixProSidebarNavigation = () => <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-white/10 bg-black/40 px-4 py-8 backdrop-blur-2xl lg:flex">
    <div className="space-y-1 px-2">
      <p className="text-xs uppercase tracking-[0.5em] text-white/50">WinmixPro</p>
      <p className="text-lg font-semibold text-white">Admin Studio</p>
      <p className="text-sm text-white/60">Üzleti prototípus 5-15. oldal</p>
    </div>

    <nav className="mt-8 space-y-6 overflow-y-auto pr-2">
      {WINMIX_PRO_NAV_SECTIONS.map(section => <div key={section.title}>
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            {section.title}
          </p>
          <div className="mt-3 space-y-2">
            {section.items.map(item => <NavLink key={item.href} to={item.href} className={({
          isActive
        }) => `${baseClasses} ${isActive ? "border-white/40 bg-white/10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.35)]" : "text-white/70 hover:border-white/20 hover:bg-white/5"}`}>
                {({
            isActive
          }) => <div className="flex items-center gap-3">
                    <span className={`rounded-2xl border px-2 py-2 ${isActive ? "border-emerald-300/70 bg-emerald-400/10" : "border-white/10"}`}>
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.label}
                        {item.badge ? <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                            {item.badge}
                          </span> : null}
                      </p>
                      <p className="text-xs text-white/60">{item.description}</p>
                    </div>
                  </div>}
              </NavLink>)}
          </div>
        </div>)}
    </nav>
  </aside>;
export default WinmixProSidebarNavigation;