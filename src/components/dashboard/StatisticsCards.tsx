import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, Award, Flame } from "lucide-react";
import { useEffect, useState } from "react";
interface StatisticsCardsProps {
  totalPredictions: number;
  accuracy: number;
  topPattern: string;
  winningStreak: number;
}
export default function StatisticsCards({
  totalPredictions,
  accuracy,
  topPattern,
  winningStreak
}: StatisticsCardsProps) {
  const [animatedAccuracy, setAnimatedAccuracy] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedAccuracy(prev => {
          if (prev >= accuracy) {
            clearInterval(interval);
            return accuracy;
          }
          return Math.min(prev + 1, accuracy);
        });
      }, 20);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [accuracy]);
  const stats = [{
    title: "Összes Predikció",
    value: totalPredictions,
    icon: Target,
    color: "text-primary",
    gradient: "from-primary/20 to-primary/5"
  }, {
    title: "Pontosság",
    value: `${animatedAccuracy}%`,
    icon: TrendingUp,
    color: "text-secondary",
    gradient: "from-secondary/20 to-secondary/5"
  }, {
    title: "Top Minta",
    value: topPattern || "N/A",
    icon: Award,
    color: "text-primary",
    gradient: "from-primary/20 to-primary/5",
    isText: true
  }, {
    title: "Győzelmi Sorozat",
    value: winningStreak,
    icon: Flame,
    color: "text-secondary",
    gradient: "from-secondary/20 to-secondary/5"
  }];
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
      const Icon = stat.icon;
      return <Card key={stat.title} className="glass-card-hover border-border overflow-hidden animate-fade-in" style={{
        animationDelay: `${index * 100}ms`
      }}>
            <CardContent className="p-6">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground text-sm font-medium">
                    {stat.title}
                  </span>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {stat.isText ? <span className="text-xl">{stat.value}</span> : stat.value}
                </div>
              </div>
            </CardContent>
          </Card>;
    })}
    </div>;
}