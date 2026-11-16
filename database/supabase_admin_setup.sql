-- ==============================================================================
-- e-MaziShaala (ई-माझीशाळा) — Complete Supabase Admin Backend & Security Setup
-- ==============================================================================
-- Run this script in the Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard)

-- 1. User Roles Table (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'student')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Secure Database Function: is_admin()
-- Evaluates whether the current authenticated user has the 'admin' role in public.user_roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Grant execution to all authenticated sessions and anon (returns false for non-admin/anon)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 3. Row Level Security Policies for user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Ensure Books Table Schema & RLS
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_image_url TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2) DEFAULT 0,
  category TEXT DEFAULT 'General',
  isbn TEXT,
  description TEXT,
  full_description TEXT,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published books" ON public.books;
CREATE POLICY "Public can view published books" ON public.books
  FOR SELECT TO authenticated, anon
  USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to books" ON public.books;
CREATE POLICY "Admins have full access to books" ON public.books
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Ensure Batches Table Schema & RLS
CREATE TABLE IF NOT EXISTS public.batches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  registration_start TEXT,
  registration_end TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_seats INT NOT NULL DEFAULT 50,
  available_seats INT NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Registration Open', 'Full', 'Ongoing', 'Completed', 'Cancelled')),
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published batches" ON public.batches;
CREATE POLICY "Public can view published batches" ON public.batches
  FOR SELECT TO authenticated, anon
  USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to batches" ON public.batches;
CREATE POLICY "Admins have full access to batches" ON public.batches
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Ensure App Content CMS Table Schema & RLS
CREATE TABLE IF NOT EXISTS public.app_content (
  id TEXT PRIMARY KEY,
  content_key TEXT NOT NULL,
  title TEXT,
  body TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_content_key ON public.app_content(content_key);
ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published app content" ON public.app_content;
CREATE POLICY "Public can view published app content" ON public.app_content
  FOR SELECT TO authenticated, anon
  USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to app content" ON public.app_content;
CREATE POLICY "Admins have full access to app content" ON public.app_content
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Ensure App Settings Table Schema & RLS
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public settings" ON public.app_settings;
CREATE POLICY "Public can view public settings" ON public.app_settings
  FOR SELECT TO authenticated, anon
  USING (is_public = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to settings" ON public.app_settings;
CREATE POLICY "Admins have full access to settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Seed Default Settings if missing
INSERT INTO public.app_settings (setting_key, setting_value, is_public)
VALUES
  ('app_name', '{"value": "e-maazishaala"}'::jsonb, true),
  ('currency', '{"value": "INR", "symbol": "₹"}'::jsonb, true),
  ('homepage_sections', '{"books": true, "batches": true, "announcements": true, "featured_books": true, "featured_batches": true}'::jsonb, true)
ON CONFLICT (setting_key) DO NOTHING;

-- 9. Profiles Table RLS Update (Allow Admins to view all profiles)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- 10. Storage Bucket Setup (book-covers)
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can read book covers" ON storage.objects;
CREATE POLICY "Public can read book covers" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'book-covers');

DROP POLICY IF EXISTS "Admins can upload and update book covers" ON storage.objects;
CREATE POLICY "Admins can upload and update book covers" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'book-covers' AND public.is_admin())
  WITH CHECK (bucket_id = 'book-covers' AND public.is_admin());

-- ==============================================================================
-- 11. ASSIGN FIRST ADMINISTRATOR (REPLACE EMAIL BEFORE RUNNING)
-- ==============================================================================
-- Run this command after creating your user in Supabase Auth:
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'
-- FROM auth.users
-- WHERE email = 'YOUR_EMAIL@gmail.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

