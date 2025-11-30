import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AdminAuditAction } from "@/types/admin";
interface AuditLogPayload {
  action: AdminAuditAction;
  details: Record<string, unknown>;
}
const insertAuditLog = async (payload: AuditLogPayload & {
  userId: string;
}) => {
  const {
    error
  } = await supabase.from("admin_audit_log").insert({
    user_id: payload.userId,
    action: payload.action,
    details: payload.details
  });
  if (error) {
    throw error;
  }
};
export const useAuditLog = () => {
  const {
    user
  } = useAuth();
  const mutation = useMutation<void, Error, AuditLogPayload>({
    mutationFn: payload => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      return insertAuditLog({
        ...payload,
        userId: user.id
      });
    }
  });
  const log = async (action: AdminAuditAction, details: Record<string, unknown>) => {
    if (!user?.id) {
      return;
    }
    try {
      await mutation.mutateAsync({
        action,
        details
      });
    } catch (error) {
      console.error("Failed to log admin action", error);
    }
  };
  return {
    log,
    isLogging: mutation.isPending
  };
};