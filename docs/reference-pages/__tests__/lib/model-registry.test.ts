import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateModelEntry,
  validateModelRegistry,
  getModels,
  getActiveModel,
  getModelsByStatus,
  getModelById,
  clearModelRegistryCache,
  type ModelRegistryEntry,
} from "../../lib/model-registry";

const mockRegistryData = {
  models: [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "baseline_scoreline_model",
      version: "2024.11.0",
      algorithm: "LightGBM",
      status: "active",
      registered_at: "2025-01-05T08:00:00.000Z",
      path: "models/baseline_scoreline_model.pkl",
      traffic_allocation: 90,
      description: "Champion scoreline model served to production traffic.",
      metrics: {
        accuracy: 0.91,
        precision: 0.9,
        recall: 0.92,
        f1_score: 0.91,
      },
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "ensemble_candidate_model",
      version: "2025.01.1",
      algorithm: "StackedEnsemble",
      status: "candidate",
      registered_at: "2025-01-15T10:45:00.000Z",
      path: "models/ensemble_candidate_model.pkl",
      traffic_allocation: 10,
      description: "Offensive-biased ensemble currently receiving a limited portion of traffic.",
      metrics: {
        accuracy: 0.93,
        precision: 0.94,
        recall: 0.91,
        f1_score: 0.92,
      },
    },
    {
      id: "56b92dd4-3c2b-4b24-a93b-5999e12719b2",
      name: "logit_shadow_november",
      version: "2024.12.0",
      algorithm: "LogisticRegression",
      status: "shadow",
      registered_at: "2024-11-20T11:31:15.543Z",
      path: "models/LogisticRegression_20251120_113115.pkl",
      traffic_allocation: 0,
      description: "Shadow deployment capturing telemetry for November logit refresh.",
      metrics: {
        accuracy: 0.9,
        precision: 0.9,
        recall: 0.9,
        f1_score: 0.9,
      },
    },
  ] satisfies ModelRegistryEntry[],
};

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

function createMockResponse(data: unknown, ok: boolean = true, status: number = 200) {
  const response = {
    ok,
    status,
    json: async () => data,
    clone: () => ({ ...response }),
    text: async () => JSON.stringify(data),
    headers: new Map(),
    redirected: false,
    statusText: ok ? "OK" : "Error",
    type: "basic" as ResponseType,
    url: "/models/model_registry.json",
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
  } satisfies Partial<Response> & { json: () => Promise<unknown> };
  return response;
}

describe("Model Registry", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearModelRegistryCache();
    mockFetch.mockResolvedValue(createMockResponse(mockRegistryData));
  });

  describe("Validation Functions", () => {
    it("should validate a correct model entry", () => {
      const validEntry = mockRegistryData.models[0];
      const result = validateModelEntry(validEntry);
      expect(result).toEqual(validEntry);
    });

    it("should throw an error for missing required fields", () => {
      const invalidEntry = {
        ...mockRegistryData.models[0],
        id: undefined,
      };

      expect(() => validateModelEntry(invalidEntry)).toThrow();
    });

    it("should throw an error for invalid UUID", () => {
      const invalidEntry = {
        ...mockRegistryData.models[0],
        id: "invalid-uuid",
      };

      expect(() => validateModelEntry(invalidEntry)).toThrow();
    });

    it("should throw an error for invalid status", () => {
      const invalidEntry = {
        ...mockRegistryData.models[0],
        status: "unknown",
      };

      expect(() => validateModelEntry(invalidEntry)).toThrow();
    });

    it("should throw an error for metrics out of range", () => {
      const invalidEntry = {
        ...mockRegistryData.models[0],
        metrics: {
          ...mockRegistryData.models[0].metrics,
          accuracy: 1.5,
        },
      };

      expect(() => validateModelEntry(invalidEntry)).toThrow();
    });

    it("should throw an error for invalid datetime", () => {
      const invalidEntry = {
        ...mockRegistryData.models[0],
        registered_at: "invalid-date",
      };

      expect(() => validateModelEntry(invalidEntry)).toThrow();
    });

    it("should validate a correct model registry payload", () => {
      const result = validateModelRegistry(mockRegistryData);
      expect(result).toEqual(mockRegistryData);
    });

    it("should throw an error for invalid registry payload", () => {
      const invalidRegistry = {
        models: [
          {
            // missing required fields
            id: "missing-fields",
          },
        ],
      };

      expect(() => validateModelRegistry(invalidRegistry)).toThrow();
    });
  });

  describe("Helper Functions", () => {
    it("should get all models", async () => {
      const models = await getModels();
      expect(models).toEqual(mockRegistryData.models);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should cache registry payloads between calls", async () => {
      await getModels();
      await getModels();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should get the active model", async () => {
      const activeModel = await getActiveModel();
      expect(activeModel?.status).toBe("active");
      expect(activeModel?.name).toBe("baseline_scoreline_model");
    });

    it("should return null when no active models exist", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          models: mockRegistryData.models.map((model) => ({
            ...model,
            status: "candidate",
          })),
        })
      );

      const activeModel = await getActiveModel();
      expect(activeModel).toBeNull();
    });

    it("should return the most recent active model when multiple exist", async () => {
      const newerActiveModel: ModelRegistryEntry = {
        ...mockRegistryData.models[1],
        id: "550e8400-e29b-41d4-a716-446655440099",
        status: "active",
        registered_at: "2025-02-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValue(
        createMockResponse({
          models: [mockRegistryData.models[0], newerActiveModel],
        })
      );

      const activeModel = await getActiveModel();
      expect(activeModel?.id).toBe(newerActiveModel.id);
    });

    it("should get models by status", async () => {
      const candidates = await getModelsByStatus("candidate");
      expect(candidates).toHaveLength(1);
      expect(candidates[0].status).toBe("candidate");
    });

    it("should get model by ID", async () => {
      const model = await getModelById("56b92dd4-3c2b-4b24-a93b-5999e12719b2");
      expect(model?.name).toBe("logit_shadow_november");
    });

    it("should return null for non-existent model ID", async () => {
      const model = await getModelById("non-existent-id");
      expect(model).toBeNull();
    });

    it("should handle fetch errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(getModels()).rejects.toThrow("Failed to load model registry: Network error");
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValue(createMockResponse(null, false, 404));

      await expect(getModels()).rejects.toThrow("Failed to fetch model registry: 404");
    });
  });
});
