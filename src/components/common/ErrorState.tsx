import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}
const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry
}) => {
  return <Alert variant="destructive" className="mb-6">
      <AlertDescription className="flex items-center justify-between gap-3">
        <span>{message}</span>
        {onRetry ? <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button> : null}
      </AlertDescription>
    </Alert>;
};
export default ErrorState;