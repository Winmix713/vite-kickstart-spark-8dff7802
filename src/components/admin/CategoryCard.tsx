import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminCategoryCard } from "@/types/admin";
interface CategoryCardProps {
  card: AdminCategoryCard;
}
const formatValue = (value: AdminCategoryCard["value"]): string => {
  if (value === null || value === undefined) {
    return "–";
  }
  if (typeof value === "number") {
    return new Intl.NumberFormat().format(value);
  }
  return String(value);
};
const CategoryCard = memo(({
  card
}: CategoryCardProps) => {
  return <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br shadow-sm transition hover:shadow-md">
      <div className={`pointer-events-none absolute inset-0 opacity-80 ${card.accentColorClass}`} />
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <card.icon className="h-5 w-5" />
              {card.title}
            </CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </div>
          {card.pill && <span className="rounded-full bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
              {card.pill}
            </span>}
        </div>
      </CardHeader>
      <CardContent className="relative z-10 flex items-end justify-between">
        <span className="text-3xl font-semibold text-foreground">{formatValue(card.value)}</span>
      </CardContent>
      <CardFooter className="relative z-10">
        <Button asChild variant="outline" className="h-11 hover:bg-background/60">
          <Link to={card.href}>Open</Link>
        </Button>
      </CardFooter>
    </Card>;
});
CategoryCard.displayName = "CategoryCard";
export default CategoryCard;