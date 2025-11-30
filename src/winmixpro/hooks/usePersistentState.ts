import { useCallback, useMemo, useState } from "react";
const resolveInitial = <T,>(value: T | (() => T)): T => typeof value === "function" ? (value as () => T)() : value;
export const usePersistentState = <T,>(key: string, initialValue: T | (() => T)) => {
  const safeInitial = useMemo(() => {
    if (typeof window === "undefined") {
      return resolveInitial(initialValue);
    }
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`[winmixpro] localStorage parse error for ${key}`, error);
    }
    return resolveInitial(initialValue);
  }, [initialValue, key]);
  const [value, setValue] = useState<T>(safeInitial);
  const updateValue = useCallback((next: T | ((prev: T) => T)) => {
    setValue(prev => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch (error) {
          console.warn(`[winmixpro] localStorage write error for ${key}`, error);
        }
      }
      return resolved;
    });
  }, [key]);
  return [value, updateValue] as const;
};