import { supabase } from '@/integrations/supabase/client'

/**
 * Load a page layout by page ID
 * Returns both page metadata and the latest layout
 */
export async function loadPageLayout(pageId) {
  try {
    const { data, error } = await supabase
      .from('page_layouts')
      .select(`
        id,
        layout_json,
        updated_at,
        pages:page_id (
          id,
          slug,
          title,
          is_published,
          created_at
        )
      `)
      .eq('page_id', pageId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No layout found
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error loading page layout:', error)
    throw error
  }
}

/**
 * Save or update a page layout
 * Upserts the layout_json with the Redux slice shape
 */
export async function savePageLayout(pageId, layoutPayload) {
  try {
    const { data, error } = await supabase
      .from('page_layouts')
      .upsert(
        {
          page_id: pageId,
          layout_json: layoutPayload,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'page_id',
        }
      )
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error saving page layout:', error)
    throw error
  }
}

/**
 * Create a new page with initial layout
 */
export async function createPage(slug, title, initialLayout = null) {
  try {
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .insert({
        slug,
        title,
      })
      .select()
      .single()

    if (pageError) {
      throw pageError
    }

    if (initialLayout) {
      const { error: layoutError } = await supabase
        .from('page_layouts')
        .insert({
          page_id: pageData.id,
          layout_json: initialLayout,
        })

      if (layoutError) {
        throw layoutError
      }
    }

    return pageData
  } catch (error) {
    console.error('Error creating page:', error)
    throw error
  }
}

/**
 * Get page by slug
 */
export async function getPageBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No page found
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error getting page by slug:', error)
    throw error
  }
}

/**
 * Delete a page and its layouts
 */
export async function deletePage(pageId) {
  try {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting page:', error)
    throw error
  }
}

/**
 * Update page metadata (slug, title, is_published)
 */
export async function updatePageMetadata(pageId, updates) {
  try {
    const { data, error } = await supabase
      .from('pages')
      .update(updates)
      .eq('id', pageId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating page metadata:', error)
    throw error
  }
}
