import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AdminPhase9Settings, AdminPhase9SettingsInput } from "@/types/admin";
import { useAuditLog } from "@/hooks/admin/useAuditLog";
const SETTINGS_QUERY_KEY = ["admin", "phase9", "settings"] as const;
const MARKET_MODES: AdminPhase9Settings["market_integration_mode"][] = ["off", "test", "prod"];
const CROSS_DEPTHS: AdminPhase9Settings["cross_league_depth"][] = ["low", "medium", "high"];
const parseSettings = (settings: Record<string, unknown>): AdminPhase9Settings => {
  const marketMode = typeof settings.market_integration_mode === "string" && MARKET_MODES.includes(settings.market_integration_mode as AdminPhase9Settings["market_integration_mode"]) ? settings.market_integration_mode as AdminPhase9Settings["market_integration_mode"] : "test";
  const crossDepth = typeof settings.cross_league_depth === "string" && CROSS_DEPTHS.includes(settings.cross_league_depth as AdminPhase9Settings["cross_league_depth"]) ? settings.cross_league_depth as AdminPhase9Settings["cross_league_depth"] : "medium";
  return {
    id: Number(settings.id ?? 1),
    collaborative_intelligence_enabled: Boolean(settings.collaborative_intelligence_enabled),
    temporal_decay_enabled: Boolean(settings.temporal_decay_enabled ?? true),
    temporal_decay_rate: Number(settings.temporal_decay_rate ?? 0),
    freshness_check_seconds: Number(settings.freshness_check_seconds ?? 60),
    staleness_threshold_days: Number(settings.staleness_threshold_days ?? 7),
    market_integration_mode: marketMode,
    market_api_key: settings.market_api_key as string | null ?? null,
    cross_league_enabled: Boolean(settings.cross_league_enabled ?? true),
    cross_league_league_count: Number(settings.cross_league_league_count ?? 5),
    cross_league_depth: crossDepth,
    updated_at: typeof settings.updated_at === "string" ? settings.updated_at : new Date().toISOString()
  };
};
const fetchPhase9Settings = async (): Promise<AdminPhase9Settings> => {
  const {
    data,
    error
  } = await supabase.from("phase9_settings").select("*").eq("id", 1).maybeSingle();
  if (error && error.code !== "PGRST116" && error.code !== "42P01") {
    throw error;
  }
  if (!data) {
    return parseSettings({
      id: 1
    });
  }
  return parseSettings(data as Record<string, unknown>);
};
const upsertPhase9Settings = async (updates: Partial<AdminPhase9SettingsInput>): Promise<AdminPhase9Settings> => {
  const payload = {
    id: 1,
    ...updates,
    updated_at: new Date().toISOString()
  };
  const {
    data,
    error
  } = await supabase.from("phase9_settings").upsert(payload, {
    onConflict: "id"
  }).select("*").eq("id", 1).single();
  if (error) {
    throw error;
  }
  return parseSettings(data as Record<string, unknown>);
};
export const usePhase9Settings = () => {
  const queryClient = useQueryClient();
  const {
    log
  } = useAuditLog();
  const query = useQuery<AdminPhase9Settings>({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchPhase9Settings,
    staleTime: 60_000
  });
  const mutation = useMutation<AdminPhase9Settings, Error, Partial<AdminPhase9SettingsInput>>({
    mutationFn: upsertPhase9Settings,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: SETTINGS_QUERY_KEY
      });
      toast.success("Phase 9 settings saved");
      await log("phase9_updated", variables);
    },
    onError: error => {
      toast.error(`Failed to save settings: ${error.message}`);
    }
  });
  useEffect(() => {
    if (query.error) {
      toast.error(query.error instanceof Error ? query.error.message : "Failed to load Phase 9 settings");
    }
  }, [query.error]);
  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    saveSettings: mutation.mutateAsync,
    isSaving: mutation.isPending,
    refetch: query.refetch
  };
};