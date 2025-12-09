import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAutosaveLayout } from "@/hooks/cms/useAutosaveLayout";
import * as Redux from "react-redux";

// Mock dependencies
vi.mock("react-redux");
vi.mock("@/hooks/cms/useSavePageLayout");
vi.mock("react-toastify");

import { useSavePageLayout } from "@/hooks/cms/useSavePageLayout";

describe("useAutosaveLayout", () => {
  const mockPageId = "page-123";
  const mockLayoutData = {
    instances: { "widget-1": { type: "Widget" } },
    layout: [],
  };

  const defaultReduxState = {
    pageLayouts: {
      isDirty: false,
      layouts: { [mockPageId]: mockLayoutData },
      lastSavedSnapshot: JSON.stringify(mockLayoutData),
    },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Mock useSelector
    Redux.useSelector = vi
      .fn()
      .mockImplementation((selector) => selector(defaultReduxState));

    // Mock useSavePageLayout
    useSavePageLayout.mockReturnValue({
      save: vi.fn(),
      isPending: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not save when isDirty is false", () => {
    const { result } = renderHook(() => useAutosaveLayout(mockPageId));

    vi.advanceTimersByTime(5000);

    expect(result.current.isSaving).toBe(false);
  });

  it("should debounce saves for 5 seconds", async () => {
    const saveFn = vi.fn();
    useSavePageLayout.mockReturnValue({
      save: saveFn,
      isPending: false,
    });

    Redux.useSelector = vi.fn().mockImplementation((selector) => {
      const state = {
        ...defaultReduxState,
        pageLayouts: {
          ...defaultReduxState.pageLayouts,
          isDirty: true,
        },
      };
      return selector(state);
    });

    renderHook(() => useAutosaveLayout(mockPageId, { debounceMs: 5000 }));

    // Advance by 4 seconds - should not save yet
    vi.advanceTimersByTime(4000);
    expect(saveFn).not.toHaveBeenCalled();

    // Advance by 1 more second - should save now
    vi.advanceTimersByTime(1000);
    expect(saveFn).toHaveBeenCalledWith({
      pageId: mockPageId,
      layoutPayload: mockLayoutData,
    });
  });

  it("should cancel pending saves on unmount", () => {
    const saveFn = vi.fn();
    useSavePageLayout.mockReturnValue({
      save: saveFn,
      isPending: false,
    });

    Redux.useSelector = vi.fn().mockImplementation((selector) => {
      const state = {
        ...defaultReduxState,
        pageLayouts: {
          ...defaultReduxState.pageLayouts,
          isDirty: true,
        },
      };
      return selector(state);
    });

    const { unmount } = renderHook(() => useAutosaveLayout(mockPageId));

    // Advance halfway through debounce
    vi.advanceTimersByTime(2500);

    // Unmount component
    unmount();

    // Advance past debounce time
    vi.advanceTimersByTime(2500);

    // Save should not be called after unmount
    expect(saveFn).not.toHaveBeenCalled();
  });

  it("should not save if snapshot has not changed", () => {
    const saveFn = vi.fn();
    useSavePageLayout.mockReturnValue({
      save: saveFn,
      isPending: false,
    });

    Redux.useSelector = vi.fn().mockImplementation((selector) => {
      const state = {
        ...defaultReduxState,
        pageLayouts: {
          ...defaultReduxState.pageLayouts,
          isDirty: true,
          lastSavedSnapshot: JSON.stringify(mockLayoutData),
        },
      };
      return selector(state);
    });

    renderHook(() => useAutosaveLayout(mockPageId));

    vi.advanceTimersByTime(5000);

    // Should not save if nothing changed from last saved snapshot
    expect(saveFn).not.toHaveBeenCalled();
  });

  it("should not save when in-flight mutation is pending", () => {
    const saveFn = vi.fn();
    useSavePageLayout.mockReturnValue({
      save: saveFn,
      isPending: true, // Mutation is pending
    });

    Redux.useSelector = vi.fn().mockImplementation((selector) => {
      const state = {
        ...defaultReduxState,
        pageLayouts: {
          ...defaultReduxState.pageLayouts,
          isDirty: true,
          lastSavedSnapshot: JSON.stringify({}), // Different snapshot
        },
      };
      return selector(state);
    });

    renderHook(() => useAutosaveLayout(mockPageId));

    vi.advanceTimersByTime(5000);

    // Should not save if mutation is pending
    expect(saveFn).not.toHaveBeenCalled();
  });

  it("should return correct hasChanges status", () => {
    Redux.useSelector = vi.fn().mockImplementation((selector) => {
      const state = {
        ...defaultReduxState,
        pageLayouts: {
          ...defaultReduxState.pageLayouts,
          isDirty: true,
        },
      };
      return selector(state);
    });

    const { result } = renderHook(() => useAutosaveLayout(mockPageId));

    expect(result.current.hasChanges).toBe(true);
  });

  it("should respect custom debounceMs option", async () => {
    const saveFn = vi.fn();
    useSavePageLayout.mockReturnValue({
      save: saveFn,
      isPending: false,
    });

    Redux.useSelector = vi.fn().mockImplementation((selector) => {
      const state = {
        ...defaultReduxState,
        pageLayouts: {
          ...defaultReduxState.pageLayouts,
          isDirty: true,
          lastSavedSnapshot: JSON.stringify({}),
        },
      };
      return selector(state);
    });

    renderHook(() => useAutosaveLayout(mockPageId, { debounceMs: 3000 }));

    // Advance by 2 seconds - should not save yet
    vi.advanceTimersByTime(2000);
    expect(saveFn).not.toHaveBeenCalled();

    // Advance by 1 more second - should save now
    vi.advanceTimersByTime(1000);
    expect(saveFn).toHaveBeenCalled();
  });

  it("should respect enabled option", () => {
    const saveFn = vi.fn();
    useSavePageLayout.mockReturnValue({
      save: saveFn,
      isPending: false,
    });

    Redux.useSelector = vi.fn().mockImplementation((selector) => {
      const state = {
        ...defaultReduxState,
        pageLayouts: {
          ...defaultReduxState.pageLayouts,
          isDirty: true,
          lastSavedSnapshot: JSON.stringify({}),
        },
      };
      return selector(state);
    });

    renderHook(() => useAutosaveLayout(mockPageId, { enabled: false }));

    vi.advanceTimersByTime(5000);

    // Should not save when disabled
    expect(saveFn).not.toHaveBeenCalled();
  });
});
