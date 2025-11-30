import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { describe, it, expect, beforeEach, vi } from "vitest";
describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("should initialize with default value when no stored value exists", () => {
    const {
      result
    } = renderHook(() => useLocalStorage("test-key", "default-value"));
    expect(result.current[0]).toBe("default-value");
  });
  it("should initialize with stored value when it exists", () => {
    localStorage.setItem("test-key", JSON.stringify("stored-value"));
    const {
      result
    } = renderHook(() => useLocalStorage("test-key", "default-value"));
    expect(result.current[0]).toBe("stored-value");
  });
  it("should update localStorage when value is set", () => {
    const {
      result
    } = renderHook(() => useLocalStorage("test-key", "initial"));
    act(() => {
      result.current[1]("updated");
    });
    expect(result.current[0]).toBe("updated");
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("updated"));
  });
  it("should support functional updates", () => {
    const {
      result
    } = renderHook(() => useLocalStorage("test-key", 0));
    act(() => {
      result.current[1](prev => prev + 1);
    });
    expect(result.current[0]).toBe(1);
  });
  it("should remove value from localStorage when removeValue is called", () => {
    const {
      result
    } = renderHook(() => useLocalStorage("test-key", "value"));
    act(() => {
      result.current[1]("new-value");
    });
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"));
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe("value");
    expect(localStorage.getItem("test-key")).toBeNull();
  });
  it("should handle complex objects", () => {
    const complexObject = {
      name: "test",
      nested: {
        value: 42
      }
    };
    const {
      result
    } = renderHook(() => useLocalStorage("test-key", complexObject));
    expect(result.current[0]).toEqual(complexObject);
    const updatedObject = {
      name: "updated",
      nested: {
        value: 100
      }
    };
    act(() => {
      result.current[1](updatedObject);
    });
    expect(result.current[0]).toEqual(updatedObject);
  });
  it("should handle parse errors gracefully", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem("test-key", "invalid-json");
    const {
      result
    } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("default");
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
  it("should sync across multiple hook instances", () => {
    const {
      result: result1
    } = renderHook(() => useLocalStorage("shared-key", "initial"));
    const {
      result: result2
    } = renderHook(() => useLocalStorage("shared-key", "initial"));
    act(() => {
      result1.current[1]("updated");
    });
    expect(result1.current[0]).toBe("updated");
    expect(localStorage.getItem("shared-key")).toBe(JSON.stringify("updated"));
  });
});