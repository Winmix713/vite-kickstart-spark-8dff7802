import { useState, useEffect, useCallback } from "react";
interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: number;
  category: string;
}
const STORAGE_KEY = "winmixpro-features";
export const useFeatureManager = (initialFeatures: Feature[]) => {
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [isLoading, setIsLoading] = useState(false);

  // Load features from localStorage on mount
  useEffect(() => {
    const loadFeatures = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setFeatures(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Failed to load features from localStorage:", error);
      }
    };
    loadFeatures();
  }, []);

  // Save features to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
    } catch (error) {
      console.error("Failed to save features to localStorage:", error);
    }
  }, [features]);
  const updateFeature = useCallback((id: string, updates: Partial<Feature>) => {
    setFeatures(prev => prev.map(f => f.id === id ? {
      ...f,
      ...updates
    } : f));
  }, []);
  const toggleFeature = useCallback((id: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? {
      ...f,
      enabled: !f.enabled,
      rollout: !f.enabled ? f.rollout : 0
    } : f));
  }, []);
  const setRollout = useCallback((id: string, rollout: number) => {
    setFeatures(prev => prev.map(f => f.id === id ? {
      ...f,
      rollout: Math.max(0, Math.min(100, rollout))
    } : f));
  }, []);
  const deleteFeature = useCallback((id: string) => {
    setFeatures(prev => prev.filter(f => f.id !== id));
  }, []);
  const addFeature = useCallback((feature: Feature) => {
    setFeatures(prev => [...prev, feature]);
  }, []);
  const enableAll = useCallback(() => {
    setFeatures(prev => prev.map(f => ({
      ...f,
      enabled: true,
      rollout: 100
    })));
  }, []);
  const disableAll = useCallback(() => {
    setFeatures(prev => prev.map(f => ({
      ...f,
      enabled: false,
      rollout: 0
    })));
  }, []);
  const exportAsJSON = useCallback(() => {
    return JSON.stringify(features, null, 2);
  }, [features]);
  const importFromJSON = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString) as Feature[];
      // Validate basic structure
      if (!Array.isArray(imported)) {
        throw new Error("Imported data must be an array");
      }
      setFeatures(imported);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to import features"
      };
    }
  }, []);
  return {
    features,
    isLoading,
    updateFeature,
    toggleFeature,
    setRollout,
    deleteFeature,
    addFeature,
    enableAll,
    disableAll,
    exportAsJSON,
    importFromJSON
  };
};