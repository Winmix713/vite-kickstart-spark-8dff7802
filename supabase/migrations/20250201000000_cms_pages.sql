-- Helper function to check if current user is admin
-- This assumes public.is_admin() is defined in the Supabase project
-- If not, you can create it or modify this to use a different check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $
BEGIN
  -- Check user_profiles table for admin role
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
EXCEPTION WHEN undefined_table THEN
  -- Fallback: if user_profiles doesn't exist, deny access
  RETURN FALSE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the pages table
CREATE TABLE public.pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create the page_layouts table
CREATE TABLE public.page_layouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  layout_json jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create index on slug for faster lookups
CREATE INDEX idx_pages_slug ON public.pages(slug);

-- Create index on page_id for faster lookups
CREATE INDEX idx_page_layouts_page_id ON public.page_layouts(page_id);

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_page_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update page_layouts.updated_at on insert/update
CREATE TRIGGER update_page_layouts_updated_at_trigger
BEFORE INSERT OR UPDATE ON public.page_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_page_layouts_updated_at();

-- Enable RLS on pages table
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on page_layouts table
ALTER TABLE public.page_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies for pages table (admin-only access)
CREATE POLICY "admin_can_view_pages"
  ON public.pages
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_can_insert_pages"
  ON public.pages
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_can_update_pages"
  ON public.pages
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "admin_can_delete_pages"
  ON public.pages
  FOR DELETE
  USING (public.is_admin());

-- Service role can bypass RLS
CREATE POLICY "service_role_access_pages"
  ON public.pages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create policies for page_layouts table (admin-only access)
CREATE POLICY "admin_can_view_page_layouts"
  ON public.page_layouts
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_can_insert_page_layouts"
  ON public.page_layouts
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_can_update_page_layouts"
  ON public.page_layouts
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "admin_can_delete_page_layouts"
  ON public.page_layouts
  FOR DELETE
  USING (public.is_admin());

-- Service role can bypass RLS
CREATE POLICY "service_role_access_page_layouts"
  ON public.page_layouts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
