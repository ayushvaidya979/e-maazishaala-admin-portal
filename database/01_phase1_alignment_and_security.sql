-- ==============================================================================
-- e-MaziShaala (ई-माझीशाळा) — Phase 1: Database Schema Alignment & Security Migration
-- ==============================================================================
-- Description:
--   Non-destructive migration to align database schemas between Admin Portal and
--   Student Portal, establish strict role-based Row Level Security (RLS), link
--   Batches to Courses, add batch-targeted notifications, and configure Supabase
--   Realtime replication on all student-facing tables.
--
-- Target Database: https://supabase.com/dashboard/project/ozwyifbaqmfuytgwzmjy/sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ROLE-BASED ACCESS CONTROL (RBAC) & SECURITY DEFINER FUNCTION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'student')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function: Evaluates whether the currently authenticated caller is an admin
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Policies for user_roles
DROP POLICY IF EXISTS "Users can view own role or admin views all" ON public.user_roles;
CREATE POLICY "Users can view own role or admin views all" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. SCHEMA ALIGNMENT: BOOKS TABLE (Unify Admin & Student Fields)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS standard INT DEFAULT 10;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'General';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS publisher TEXT DEFAULT 'e-MaziShaala Publications';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS publication_status TEXT DEFAULT 'published' CHECK (publication_status IN ('published', 'coming_soon'));
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS release_date TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS pages INT DEFAULT 120;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS edition TEXT DEFAULT '2025 Revised Edition';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS isbn TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS table_of_contents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 1;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

CREATE INDEX IF NOT EXISTS idx_books_standard ON public.books(standard);
CREATE INDEX IF NOT EXISTS idx_books_subject ON public.books(subject);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(publication_status);

-- Non-destructively harmonize duplicate/synonym columns
UPDATE public.books
SET cover_image_url = COALESCE(cover_image_url, cover_image),
    cover_image = COALESCE(cover_image, cover_image_url),
    publication_status = COALESCE(publication_status, CASE WHEN is_published THEN 'published' ELSE 'coming_soon' END),
    is_published = COALESCE(is_published, publication_status = 'published'),
    is_bestseller = COALESCE(is_bestseller, is_featured, false),
    is_featured = COALESCE(is_featured, is_bestseller, false),
    subject = COALESCE(subject, category, 'General')
WHERE cover_image_url IS NULL OR cover_image IS NULL OR publication_status IS NULL;

-- Books RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published books" ON public.books;
DROP POLICY IF EXISTS "Public can view books" ON public.books;
CREATE POLICY "Public can view published books" ON public.books
  FOR SELECT TO authenticated, anon
  USING (is_published = true OR publication_status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to books" ON public.books;
DROP POLICY IF EXISTS "Allow portal write books" ON public.books;
CREATE POLICY "Admins have full access to books" ON public.books
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. SCHEMA ALIGNMENT: COURSES & CURRICULUM
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  standard INT NOT NULL CHECK (standard >= 1 AND standard <= 10),
  subject TEXT NOT NULL,
  thumbnail TEXT,
  instructor_name TEXT NOT NULL,
  instructor_title TEXT,
  instructor_avatar TEXT,
  instructor_bio TEXT,
  instructor_rating NUMERIC(3,2) DEFAULT 4.90,
  instructor_students_count INT DEFAULT 10000,
  instructor_experience_years INT DEFAULT 10,
  price NUMERIC(10,2) DEFAULT 0,
  discounted_price NUMERIC(10,2) DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 4.90,
  review_count INT DEFAULT 100,
  lessons_count INT DEFAULT 50,
  duration TEXT DEFAULT '80 Hours',
  language TEXT DEFAULT 'Marathi & English',
  is_popular BOOLEAN DEFAULT false,
  is_upcoming BOOLEAN DEFAULT false,
  start_date TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.course_chapters (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES public.course_chapters(id) ON DELETE CASCADE,
  lesson_number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  duration TEXT DEFAULT '45 mins',
  is_free_preview BOOLEAN DEFAULT false,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_standard ON public.courses(standard);
CREATE INDEX IF NOT EXISTS idx_courses_subject ON public.courses(subject);
CREATE INDEX IF NOT EXISTS idx_course_chapters_course_id ON public.course_chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_chapter_id ON public.course_lessons(chapter_id);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- Courses RLS: Public reads published; Admin has full control
DROP POLICY IF EXISTS "Public can view courses" ON public.courses;
CREATE POLICY "Public can view courses" ON public.courses
  FOR SELECT TO authenticated, anon
  USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to courses" ON public.courses;
CREATE POLICY "Admins have full access to courses" ON public.courses
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can view course chapters" ON public.course_chapters;
CREATE POLICY "Public can view course chapters" ON public.course_chapters
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins have full access to course chapters" ON public.course_chapters;
CREATE POLICY "Admins have full access to course chapters" ON public.course_chapters
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can view course lessons" ON public.course_lessons;
CREATE POLICY "Public can view course lessons" ON public.course_lessons
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins have full access to course lessons" ON public.course_lessons;
CREATE POLICY "Admins have full access to course lessons" ON public.course_lessons
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. SCHEMA ALIGNMENT: BATCHES (Link to Parent Courses)
-- ------------------------------------------------------------------------------

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
  total_seats INT NOT NULL DEFAULT 100,
  available_seats INT NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'Upcoming',
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Requirement 3: Link Academic Batches to Courses using course_id (nullable for standalone)
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS standard INT DEFAULT 10;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'General';

CREATE INDEX IF NOT EXISTS idx_batches_course_id ON public.batches(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_standard ON public.batches(standard);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published batches" ON public.batches;
DROP POLICY IF EXISTS "Public can view batches" ON public.batches;
CREATE POLICY "Public can view published batches" ON public.batches
  FOR SELECT TO authenticated, anon
  USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to batches" ON public.batches;
DROP POLICY IF EXISTS "Allow portal write batches" ON public.batches;
CREATE POLICY "Admins have full access to batches" ON public.batches
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. SCHEMA ALIGNMENT: LIVE CLASSES & REMINDERS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.live_classes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  standard INT NOT NULL CHECK (standard >= 1 AND standard <= 10),
  teacher_name TEXT NOT NULL,
  teacher_avatar TEXT,
  teacher_title TEXT,
  status TEXT NOT NULL CHECK (status IN ('live', 'upcoming', 'completed')),
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  duration TEXT DEFAULT '75 mins',
  thumbnail TEXT,
  attendees_count INT DEFAULT 0,
  has_recording BOOLEAN DEFAULT false,
  recording_duration TEXT,
  recording_url TEXT,
  meeting_link TEXT DEFAULT 'https://meet.google.com',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.live_classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.live_class_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  live_class_id TEXT NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, live_class_id)
);

CREATE INDEX IF NOT EXISTS idx_live_classes_status ON public.live_classes(status);
CREATE INDEX IF NOT EXISTS idx_live_classes_standard ON public.live_classes(standard);
CREATE INDEX IF NOT EXISTS idx_live_class_reminders_user ON public.live_class_reminders(user_id);

ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_class_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view live classes" ON public.live_classes;
CREATE POLICY "Public can view live classes" ON public.live_classes
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins have full access to live classes" ON public.live_classes;
CREATE POLICY "Admins have full access to live classes" ON public.live_classes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Student reminder policies (Student-private)
DROP POLICY IF EXISTS "Users can view own class reminders" ON public.live_class_reminders;
CREATE POLICY "Users can view own class reminders" ON public.live_class_reminders
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can set class reminders" ON public.live_class_reminders;
CREATE POLICY "Users can set class reminders" ON public.live_class_reminders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own class reminders" ON public.live_class_reminders;
CREATE POLICY "Users can delete own class reminders" ON public.live_class_reminders
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. SCHEMA ALIGNMENT: STUDY MATERIALS & DOWNLOADS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.study_materials (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  standard INT NOT NULL CHECK (standard >= 1 AND standard <= 10),
  category TEXT NOT NULL CHECK (category IN ('pdf_notes', 'study_material', 'worksheet', 'question_paper', 'book')),
  file_type TEXT DEFAULT 'PDF' CHECK (file_type IN ('PDF', 'DOCX', 'ZIP')),
  file_size TEXT DEFAULT '2.4 MB',
  chapter TEXT,
  pages_count INT DEFAULT 10,
  summary TEXT,
  downloads_count INT DEFAULT 0,
  download_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.user_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id TEXT NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_study_materials_standard ON public.study_materials(standard);
CREATE INDEX IF NOT EXISTS idx_study_materials_category ON public.study_materials(category);
CREATE INDEX IF NOT EXISTS idx_user_downloads_user ON public.user_downloads(user_id);

ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view study materials" ON public.study_materials;
CREATE POLICY "Public can view study materials" ON public.study_materials
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins have full access to study materials" ON public.study_materials;
CREATE POLICY "Admins have full access to study materials" ON public.study_materials
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own downloads" ON public.user_downloads;
CREATE POLICY "Users can view own downloads" ON public.user_downloads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can save downloads" ON public.user_downloads;
CREATE POLICY "Users can save downloads" ON public.user_downloads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own downloads" ON public.user_downloads;
CREATE POLICY "Users can remove own downloads" ON public.user_downloads
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. CENTRAL NOTIFICATIONS & ANNOUNCEMENTS (Requirement 2)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('live', 'course', 'book', 'general', 'exam')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add batch-targeted notification capability
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS batch_id TEXT REFERENCES public.batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_batch_id ON public.notifications(batch_id);

-- Individual student read/unread tracking for global broadcasts
CREATE TABLE IF NOT EXISTS public.notification_reads (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON public.notification_reads(user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Notifications RLS:
-- Students can view:
--   1. Global broadcasts (user_id IS NULL AND batch_id IS NULL)
--   2. Direct personal notifications (user_id = auth.uid())
--   3. Batch-targeted notifications for batches they are enrolled in
-- Admins can view all notifications
DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
CREATE POLICY "Users can view notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    user_id IS NULL
    OR user_id = auth.uid()
    OR (
      batch_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.enrollments e
        JOIN public.batches b ON b.course_id = e.course_id OR b.id = e.course_id
        WHERE e.user_id = auth.uid() AND b.id = public.notifications.batch_id
      )
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins have full access to notifications" ON public.notifications;
CREATE POLICY "Admins have full access to notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
CREATE POLICY "Users can mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notification reads RLS
DROP POLICY IF EXISTS "Users can view own notification reads" ON public.notification_reads;
CREATE POLICY "Users can view own notification reads" ON public.notification_reads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can record own notification read" ON public.notification_reads;
CREATE POLICY "Users can record own notification read" ON public.notification_reads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 8. CMS & DYNAMIC SETTINGS
-- ------------------------------------------------------------------------------

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

-- Seed default settings if missing
INSERT INTO public.app_settings (setting_key, setting_value, is_public)
VALUES
  ('app_name', '{"value": "e-maazishaala"}'::jsonb, true),
  ('currency', '{"value": "INR", "symbol": "₹"}'::jsonb, true),
  ('homepage_sections', '{"books": true, "batches": true, "announcements": true, "featured_books": true, "featured_batches": true}'::jsonb, true)
ON CONFLICT (setting_key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. ENABLE SUPABASE REALTIME REPLICATION ON ALL STUDENT-FACING TABLES
-- ------------------------------------------------------------------------------

ALTER TABLE public.books REPLICA IDENTITY FULL;
ALTER TABLE public.batches REPLICA IDENTITY FULL;
ALTER TABLE public.courses REPLICA IDENTITY FULL;
ALTER TABLE public.course_chapters REPLICA IDENTITY FULL;
ALTER TABLE public.course_lessons REPLICA IDENTITY FULL;
ALTER TABLE public.live_classes REPLICA IDENTITY FULL;
ALTER TABLE public.study_materials REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.app_content REPLICA IDENTITY FULL;
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;

DO $$
BEGIN
  -- books
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'books') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.books;
  END IF;
  -- batches
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'batches') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.batches;
  END IF;
  -- courses
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'courses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
  END IF;
  -- course_chapters
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'course_chapters') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.course_chapters;
  END IF;
  -- course_lessons
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'course_lessons') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.course_lessons;
  END IF;
  -- live_classes
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_classes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_classes;
  END IF;
  -- study_materials
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'study_materials') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_materials;
  END IF;
  -- notifications
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  -- app_content
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_content') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_content;
  END IF;
  -- app_settings
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
  END IF;
END;
$$;

