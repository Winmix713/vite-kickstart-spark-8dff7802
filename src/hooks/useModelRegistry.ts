import { useQuery } from "@tanstack/react-query";
import { getModels, type ModelRegistryEntry } from "@/lib/model-registry";
export const MODEL_REGISTRY_QUERY_KEY = ["model-registry"] as const;
export function useModelRegistry() {
  return useQuery<ModelRegistryEntry[]>({
    queryKey: MODEL_REGISTRY_QUERY_KEY,
    queryFn: getModels,
    staleTime: 5 * 60 * 1000
  });
}