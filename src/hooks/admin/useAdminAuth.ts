import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AdminUser } from "@/types/admin";
const fetchAdminProfile = async (userId: string): Promise<AdminUser> => {
  const {
    data,
    error
  } = await supabase.from("user_profiles").select("id, email, role, created_at, full_name").eq("id", userId).maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("User profile not found");
  }
  return {
    id: data.id,
    email: data.email,
    role: data.role,
    created_at: data.created_at,
    full_name: (data as {
      full_name?: string | null;
    }).full_name ?? null
  };
};
export const useAdminAuth = () => {
  const {
    user
  } = useAuth();
  const query = useQuery<AdminUser>({
    queryKey: ["admin", "auth", user?.id],
    queryFn: () => fetchAdminProfile(user?.id as string),
    enabled: Boolean(user?.id),
    staleTime: 60_000
  });
  return {
    profile: query.data ?? null,
    role: query.data?.role ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch
  };
};