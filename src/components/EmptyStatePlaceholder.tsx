import type * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export interface EmptyStatePlaceholderProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "minimal";
}
export function EmptyStatePlaceholder({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default"
}: EmptyStatePlaceholderProps) {
  if (variant === "minimal") {
    return <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
        {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
        {actionLabel && onAction && <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>}
      </div>;
  }
  return <Card className="w-full animate-fade-in">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
        {icon && <div className="mb-6 text-muted-foreground opacity-50 scale-110">{icon}</div>}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
        {actionLabel && onAction && <Button onClick={onAction} size="lg" className="mt-2">
            {actionLabel}
          </Button>}
      </CardContent>
    </Card>;
}