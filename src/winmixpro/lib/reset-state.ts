import { STORAGE_KEYS } from "./constants";
export const resetWinmixProState = (): void => {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[resetWinmixProState] Failed to remove key "${key}":`, error);
    }
  });
  window.location.reload();
};
export const exportWinmixProState = (): string => {
  if (typeof window === "undefined") return "{}";
  const state: Record<string, unknown> = {};
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      const value = window.localStorage.getItem(key);
      if (value) {
        state[key] = JSON.parse(value);
      }
    } catch (error) {
      console.warn(`[exportWinmixProState] Failed to read key "${key}":`, error);
    }
  });
  return JSON.stringify(state, null, 2);
};
export const importWinmixProState = (jsonString: string): {
  success: boolean;
  errors?: string[];
} => {
  if (typeof window === "undefined") {
    return {
      success: false,
      errors: ["Not running in browser environment"]
    };
  }
  try {
    const state = JSON.parse(jsonString) as Record<string, unknown>;
    const errors: string[] = [];
    Object.entries(state).forEach(([key, value]) => {
      if (Object.values(STORAGE_KEYS).includes(key as (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS])) {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          errors.push(`Failed to set key "${key}": ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    });
    if (errors.length > 0) {
      return {
        success: false,
        errors
      };
    }
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      errors: [`JSON parse error: ${error instanceof Error ? error.message : "Unknown error"}`]
    };
  }
};