import { Outlet } from "react-router-dom";
import WinmixProMobileHeader from "@/winmixpro/components/MobileHeader";
import WinmixProSidebarNavigation from "@/winmixpro/components/SidebarNavigation";
import { WinmixProProviders } from "@/winmixpro/providers";
const WinmixProLayout = () => <WinmixProProviders>
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_45%),_radial-gradient(circle_at_bottom,_rgba(59,130,246,0.15),_transparent_35%),_#020617] text-white">
      <div className="flex min-h-screen">
        <WinmixProSidebarNavigation />
        <div className="flex min-h-screen flex-1 flex-col">
          <WinmixProMobileHeader />
          <main className="winmixpro-scroll flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  </WinmixProProviders>;
export default WinmixProLayout;