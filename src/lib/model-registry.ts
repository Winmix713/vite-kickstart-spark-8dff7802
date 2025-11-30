import { z } from "zod";
const MODEL_REGISTRY_URL = "/model_registry.json" as const;
const ModelMetricsSchema = z.object({
  accuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1_score: z.number().min(0).max(1)
});
const ModelStatusSchema = z.enum(["active", "candidate", "shadow", "retired", "archived"]);
const ModelRegistryEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  version: z.string().min(1),
  algorithm: z.string().min(1),
  status: ModelStatusSchema,
  registered_at: z.string().datetime(),
  path: z.string().min(1),
  description: z.string().optional(),
  traffic_allocation: z.number().min(0).max(100).optional(),
  metrics: ModelMetricsSchema
});
const ModelRegistrySchema = z.object({
  models: z.array(ModelRegistryEntrySchema)
});
export type ModelMetrics = z.infer<typeof ModelMetricsSchema>;
export type ModelStatus = z.infer<typeof ModelStatusSchema>;
export type ModelRegistryEntry = z.infer<typeof ModelRegistryEntrySchema>;
export type ModelRegistry = z.infer<typeof ModelRegistrySchema>;
let cachedRegistry: ModelRegistry | null = null;
let inflightRequest: Promise<ModelRegistry> | null = null;
async function loadRegistryData(): Promise<ModelRegistry> {
  if (cachedRegistry) {
    return cachedRegistry;
  }
  if (inflightRequest) {
    return inflightRequest;
  }
  inflightRequest = (async () => {
    try {
      const response = await fetch(MODEL_REGISTRY_URL, {
        cache: "no-cache"
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch model registry: ${response.status}`);
      }
      const data = await response.json();
      const parsed = ModelRegistrySchema.parse(data);
      cachedRegistry = parsed;
      return parsed;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Model registry validation failed: ${error.errors.map(issue => `${issue.path.join(".")}: ${issue.message}`).join(", ")}`);
      }
      if (error instanceof Error) {
        throw new Error(`Failed to load model registry: ${error.message}`);
      }
      throw new Error("Failed to load model registry: Unknown error");
    } finally {
      inflightRequest = null;
    }
  })();
  return inflightRequest;
}
export function clearModelRegistryCache(): void {
  cachedRegistry = null;
  inflightRequest = null;
}
export async function getModels(): Promise<ModelRegistryEntry[]> {
  const registry = await loadRegistryData();
  return registry.models;
}
export async function getAllModels(): Promise<ModelRegistryEntry[]> {
  return getModels();
}
export async function getActiveModel(): Promise<ModelRegistryEntry | null> {
  const models = await getModels();
  const activeModels = models.filter(model => model.status === "active");
  if (!activeModels.length) {
    return null;
  }
  return activeModels.reduce((latest, current) => new Date(current.registered_at) > new Date(latest.registered_at) ? current : latest);
}
export async function getModelsByStatus(status: ModelStatus): Promise<ModelRegistryEntry[]> {
  const models = await getModels();
  return models.filter(model => model.status === status);
}
export async function getModelById(id: string): Promise<ModelRegistryEntry | null> {
  const models = await getModels();
  return models.find(model => model.id === id) ?? null;
}
export function validateModelEntry(data: unknown): ModelRegistryEntry {
  return ModelRegistryEntrySchema.parse(data);
}
export function validateModelRegistry(data: unknown): ModelRegistry {
  return ModelRegistrySchema.parse(data);
}