import { type ReactNode } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  isConfirmLoading?: boolean;
  destructive?: boolean;
}
const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onOpenChange,
  isConfirmLoading = false,
  destructive = false
}: ConfirmDialogProps) => <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isConfirmLoading} className="h-11">
          {cancelLabel}
        </AlertDialogCancel>
        <AlertDialogAction asChild disabled={isConfirmLoading}>
          <Button variant={destructive ? "destructive" : "default"} onClick={() => void onConfirm()} disabled={isConfirmLoading} className="h-11 min-w-[96px]">
            {isConfirmLoading ? "Working…" : confirmLabel}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
export default ConfirmDialog;