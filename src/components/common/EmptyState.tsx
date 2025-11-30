import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  className
}) => {
  return <Card className={cn("border-border/60 bg-muted/20", className)}>
      <CardContent className="p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground mb-4">{description}</p> : null}
        {action}
      </CardContent>
    </Card>;
};
export default EmptyState;