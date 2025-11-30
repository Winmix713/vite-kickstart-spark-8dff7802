import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
interface StatItem {
  label: string;
  value: string | number;
  type: "percentage" | "number" | "text";
  color?: "primary" | "secondary" | "destructive";
}
interface StatCardProps {
  title: string;
  icon?: React.ReactNode;
  stats: StatItem[];
  className?: string;
}
const getStatColor = (value: number) => {
  if (value >= 85) return "text-primary";
  if (value >= 70) return "text-secondary";
  return "text-destructive";
};
const getProgressColor = (value: number) => {
  if (value >= 85) return "bg-gradient-to-r from-primary to-primary/80";
  if (value >= 70) return "bg-gradient-to-r from-secondary to-secondary/80";
  return "bg-gradient-to-r from-destructive to-destructive/80";
};
const StatCard = ({
  title,
  icon,
  stats,
  className = ""
}: StatCardProps) => {
  return <Card className={`rounded-2xl ring-1 ring-border ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              {stat.type === "percentage" && <span className={`text-sm font-bold ${getStatColor(Number(stat.value))}`}>
                  {stat.value}%
                </span>}
              {stat.type === "number" && <Badge variant="secondary" className="font-bold">
                  {stat.value}
                </Badge>}
              {stat.type === "text" && <span className="text-sm font-semibold text-foreground">
                  {stat.value}
                </span>}
            </div>
            {stat.type === "percentage" && <div className="h-2 rounded-full bg-muted overflow-hidden ring-1 ring-border">
                <div className={`h-full transition-all ${getProgressColor(Number(stat.value))}`} style={{
            width: `${stat.value}%`
          }} />
              </div>}
          </div>)}
      </CardContent>
    </Card>;
};
export default StatCard;