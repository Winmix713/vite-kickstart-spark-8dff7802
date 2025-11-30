import { useCallback, useEffect, useState } from "react";
type SetValue<T> = (value: T | ((prev: T) => T)) => void;
const isBrowser = typeof window !== "undefined";
const getStorageValue = <T,>(key: string, initialValue: T): T => {
  if (!isBrowser) {
    return initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) as T : initialValue;
  } catch (error) {
    console.warn(`[useLocalStorage] Error reading key "${key}":`, error);
    return initialValue;
  }
};
export const useLocalStorage = <T,>(key: string, initialValue: T): [T, SetValue<T>, () => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => getStorageValue(key, initialValue));
  const setValue: SetValue<T> = useCallback(value => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (isBrowser) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        window.dispatchEvent(new StorageEvent("storage", {
          key,
          newValue: JSON.stringify(valueToStore),
          storageArea: window.localStorage
        }));
      }
    } catch (error) {
      console.warn(`[useLocalStorage] Error setting key "${key}":`, error);
    }
  }, [key, storedValue]);
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (isBrowser) {
        window.localStorage.removeItem(key);
        window.dispatchEvent(new StorageEvent("storage", {
          key,
          newValue: null,
          storageArea: window.localStorage
        }));
      }
    } catch (error) {
      console.warn(`[useLocalStorage] Error removing key "${key}":`, error);
    }
  }, [key, initialValue]);
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`[useLocalStorage] Error parsing storage event for key "${key}":`, error);
        }
      }
    };
    if (isBrowser) {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [key]);
  return [storedValue, setValue, removeValue];
};