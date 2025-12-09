import { supabase } from "@/integrations/supabase/client";

/**
 * CMS Page Service
 * Handles saving and loading page layouts and theme overrides to/from Supabase
 */

/**
 * Save or update page layout and theme overrides
 * @param {string} pageId - The page ID
 * @param {Object} layoutData - The page layout data
 * @param {Object} themeOverrides - Theme overrides (themeMode, themeVariant, widgetVariants, colorOverrides, etc.)
 * @returns {Promise<Object>} The saved page data
 */
export async function savePageLayout(
  pageId,
  layoutData = {},
  themeOverrides = {},
) {
  try {
    const { data, error } = await supabase
      .from("pages")
      .upsert(
        {
          id: pageId,
          layout: layoutData,
          theme_overrides: themeOverrides,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data?.user?.id,
        },
        {
          onConflict: "id",
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving page layout:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to save page layout:", error);
    throw error;
  }
}

/**
 * Load page layout and theme overrides
 * @param {string} pageId - The page ID
 * @returns {Promise<Object>} The page data with layout and theme overrides
 */
export async function loadPageLayout(pageId) {
  try {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Page not found, return default empty layout
        return {
          id: pageId,
          layout: {},
          theme_overrides: {},
        };
      }
      throw error;
    }

    return (
      data || {
        id: pageId,
        layout: {},
        theme_overrides: {},
      }
    );
  } catch (error) {
    console.error("Failed to load page layout:", error);
    throw error;
  }
}

/**
 * Update only the theme overrides for a page
 * @param {string} pageId - The page ID
 * @param {Object} themeOverrides - The theme overrides to apply
 * @returns {Promise<Object>} The updated page data
 */
export async function updatePageThemeOverrides(pageId, themeOverrides) {
  try {
    const { data, error } = await supabase
      .from("pages")
      .update({
        theme_overrides: themeOverrides,
        updated_at: new Date().toISOString(),
        updated_by: (await supabase.auth.getUser()).data?.user?.id,
      })
      .eq("id", pageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating page theme overrides:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to update page theme overrides:", error);
    throw error;
  }
}

/**
 * Get all pages
 * @returns {Promise<Array>} Array of all pages
 */
export async function getAllPages() {
  try {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Failed to fetch pages:", error);
    return [];
  }
}

/**
 * Delete a page
 * @param {string} pageId - The page ID
 * @returns {Promise<void>}
 */
export async function deletePage(pageId) {
  try {
    const { error } = await supabase.from("pages").delete().eq("id", pageId);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to delete page:", error);
    throw error;
  }
}

/**
 * Get page theme override audit log
 * @param {string} pageId - The page ID
 * @param {number} limit - Maximum number of records to retrieve
 * @returns {Promise<Array>} Array of audit log entries
 */
export async function getPageThemeOverrideAuditLog(pageId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from("page_theme_override_audit")
      .select("*")
      .eq("page_id", pageId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === "PGRST116") {
        // Table might not exist yet
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch audit log:", error);
    return [];
  }
}

/**
 * Merge page theme overrides (useful for partial updates)
 * @param {string} pageId - The page ID
 * @param {Object} partialOverrides - Partial overrides to merge
 * @returns {Promise<Object>} The updated page data
 */
export async function mergePageThemeOverrides(pageId, partialOverrides) {
  try {
    // First load the existing page
    const existingPage = await loadPageLayout(pageId);

    // Merge the overrides
    const mergedOverrides = {
      ...(existingPage.theme_overrides || {}),
      ...partialOverrides,
    };

    // Save the merged overrides
    return await updatePageThemeOverrides(pageId, mergedOverrides);
  } catch (error) {
    console.error("Failed to merge page theme overrides:", error);
    throw error;
  }
}

export default {
  savePageLayout,
  loadPageLayout,
  updatePageThemeOverrides,
  getAllPages,
  deletePage,
  getPageThemeOverrideAuditLog,
  mergePageThemeOverrides,
};
