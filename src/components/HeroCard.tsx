import { Trophy, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
const HeroCard = () => {
  return <div className="relative perspective-1000">
      {/* Floating decorations */}
      <div className="absolute -top-10 -right-10 w-[400px] h-[400px] border border-blue-400/20 rounded-full animate-float" />
      <div className="absolute -bottom-10 -left-10 w-[300px] h-[300px] border border-purple-400/20 rounded-full animate-float" style={{
      animationDelay: "1.5s"
    }} />
      
      <div className="absolute top-10 right-10 glass-card p-3 rounded-xl animate-float glow-blue">
        <Trophy className="w-8 h-8 text-yellow-400" />
      </div>
      
      <div className="absolute bottom-10 left-10 glass-card p-3 rounded-xl animate-float glow-purple" style={{
      animationDelay: "1s"
    }}>
        <Award className="w-8 h-8 text-blue-400" />
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-[380px] mx-auto bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-900/80 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/10 shadow-2xl transition-transform duration-500 hover:rotate-0" style={{
      transform: "rotateY(3deg)"
    }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-400/30">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse-subtle" />
            <span className="text-sm text-red-200 font-medium">Élő mérkőzés</span>
          </div>
          <span className="text-sm text-gray-400">21:00</span>
        </div>

        {/* Teams */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center text-2xl font-bold">
              🔴
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Arsenal</p>
              <p className="text-sm text-gray-400">Otthon</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <span className="px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 font-bold text-sm animate-pulse-subtle">
              VS
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center text-2xl font-bold">
              🔵
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Chelsea</p>
              <p className="text-sm text-gray-400">Vendég</p>
            </div>
          </div>
        </div>

        {/* Odds */}
        <div className="space-y-3 mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Hazai győzelem</span>
              <span className="text-blue-400 font-bold">42%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{
              width: "42%"
            }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Döntetlen</span>
              <span className="text-gray-400 font-bold">28%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gray-500 to-gray-400 rounded-full" style={{
              width: "28%"
            }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Vendég győzelem</span>
              <span className="text-blue-400 font-bold">30%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{
              width: "30%"
            }} />
            </div>
          </div>
        </div>

        {/* Betting buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button className="glass-card-hover text-xs py-5">
            Hazai
          </Button>
          <Button className="glass-card-hover text-xs py-5">
            Döntetlen
          </Button>
          <Button className="glass-card-hover text-xs py-5">
            Vendég
          </Button>
        </div>
      </div>
    </div>;
};
export default HeroCard;