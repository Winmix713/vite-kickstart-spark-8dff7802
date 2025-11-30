import { useState, useEffect } from "react";
import { Calendar, Brain, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10" : "bg-transparent"}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 animate-fade-in">
            <Trophy className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              WINMIX TIPSTER
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
             <a href="#matches" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
               <Calendar className="w-4 h-4" />
               <span>Mérkőzések</span>
             </a>
             <a href="#analysis" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
               <Brain className="w-4 h-4" />
               <span>V-Sports Elemzés</span>
             </a>
           </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="glass-card-hover">
              Bejelentkezés
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30">
              Regisztráció
            </Button>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden glass-card p-2 rounded-lg">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && <div className="md:hidden mt-4 glass-card rounded-xl p-4 animate-slide-in-bottom">
             <nav className="flex flex-col gap-4">
               <a href="#matches" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                 <Calendar className="w-4 h-4" />
                 <span>Mérkőzések</span>
               </a>
               <a href="#analysis" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                 <Brain className="w-4 h-4" />
                 <span>V-Sports Elemzés</span>
               </a>
               <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                 <Button variant="ghost" className="glass-card-hover w-full">
                   Bejelentkezés
                 </Button>
                 <Button className="bg-gradient-to-r from-blue-500 to-blue-600 w-full">
                   Regisztráció
                 </Button>
               </div>
             </nav>
           </div>}
      </div>
    </header>;
};
export default Header;