import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadPageLayout,
  savePageLayout,
  createPage,
  getPageBySlug,
  deletePage,
  updatePageMetadata,
} from "@/services/cms/pageLayouts";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("pageLayouts service", () => {
  const mockPageId = "page-123";
  const mockLayoutData = {
    instances: {
      "widget-1": { type: "TeamStats", title: "Team Statistics" },
      "widget-2": { type: "Leaderboard", title: "Leaderboard" },
    },
    layout: [
      { i: "widget-1", x: 0, y: 0, w: 6, h: 4 },
      { i: "widget-2", x: 6, y: 0, w: 6, h: 4 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadPageLayout", () => {
    it("should load layout data for a page", async () => {
      const mockResponse = {
        id: "layout-123",
        layout_json: mockLayoutData,
        updated_at: "2025-02-01T00:00:00Z",
        pages: {
          id: mockPageId,
          slug: "test-page",
          title: "Test Page",
          is_published: false,
          created_at: "2025-02-01T00:00:00Z",
        },
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: mockResponse, error: null }),
              }),
            }),
          }),
        }),
      });

      const result = await loadPageLayout(mockPageId);
      expect(result).toEqual(mockResponse);
      expect(result.layout_json).toEqual(mockLayoutData);
    });

    it("should return null when no layout exists", async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116" },
                }),
              }),
            }),
          }),
        }),
      });

      const result = await loadPageLayout(mockPageId);
      expect(result).toBeNull();
    });

    it("should throw error on database failure", async () => {
      const mockError = new Error("Database connection failed");

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: mockError,
                }),
              }),
            }),
          }),
        }),
      });

      await expect(loadPageLayout(mockPageId)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("savePageLayout", () => {
    it("should save layout data for a page", async () => {
      const mockResponse = {
        id: "layout-123",
        page_id: mockPageId,
        layout_json: mockLayoutData,
        updated_at: "2025-02-01T00:00:00Z",
      };

      supabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: mockResponse, error: null }),
          }),
        }),
      });

      const result = await savePageLayout(mockPageId, mockLayoutData);
      expect(result).toEqual(mockResponse);
      expect(result.layout_json).toEqual(mockLayoutData);
    });

    it("should throw error on save failure", async () => {
      const mockError = new Error("Failed to save layout");

      supabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(savePageLayout(mockPageId, mockLayoutData)).rejects.toThrow(
        "Failed to save layout",
      );
    });
  });

  describe("createPage", () => {
    it("should create a new page with layout", async () => {
      const mockPageResponse = {
        id: mockPageId,
        slug: "new-page",
        title: "New Page",
      };

      supabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPageResponse,
              error: null,
            }),
          }),
        }),
      });

      supabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const result = await createPage("new-page", "New Page", mockLayoutData);
      expect(result).toEqual(mockPageResponse);
    });
  });

  describe("getPageBySlug", () => {
    it("should retrieve page by slug", async () => {
      const mockPageResponse = {
        id: mockPageId,
        slug: "test-page",
        title: "Test Page",
        is_published: false,
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPageResponse,
              error: null,
            }),
          }),
        }),
      });

      const result = await getPageBySlug("test-page");
      expect(result).toEqual(mockPageResponse);
    });
  });

  describe("deletePage", () => {
    it("should delete a page", async () => {
      supabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      await expect(deletePage(mockPageId)).resolves.toBeUndefined();
    });
  });

  describe("updatePageMetadata", () => {
    it("should update page metadata", async () => {
      const updates = { title: "Updated Title", is_published: true };
      const mockResponse = {
        id: mockPageId,
        slug: "test-page",
        ...updates,
      };

      supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockResponse,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await updatePageMetadata(mockPageId, updates);
      expect(result).toEqual(mockResponse);
      expect(result.title).toBe("Updated Title");
      expect(result.is_published).toBe(true);
    });
  });
});
