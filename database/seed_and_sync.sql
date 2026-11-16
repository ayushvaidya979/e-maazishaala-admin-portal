-- ==============================================================================
-- e-MaziShaala (ई-माझीशाळा) — Complete Seed & Sync SQL Script
-- ==============================================================================
-- Run this in the Supabase Dashboard -> SQL Editor:
-- https://supabase.com/dashboard/project/ozwyifbaqmfuytgwzmjy/sql
--
-- This script:
-- 1. Grants complete permissions to anon and authenticated roles.
-- 2. Sets open RLS policies so Admin Portal and User Portal sync seamlessly.
-- 3. Inserts all 6 books and all 6 batches from the user portal into Supabase.
-- ==============================================================================

-- 1. Ensure Table Schemas Exist
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  standard INT DEFAULT 10,
  subject TEXT DEFAULT 'General',
  author TEXT NOT NULL,
  publisher TEXT DEFAULT 'e-MaziShaala Publications',
  cover_image TEXT,
  cover_image_url TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  original_price NUMERIC(10,2) DEFAULT 0,
  publication_status TEXT DEFAULT 'published',
  is_published BOOLEAN DEFAULT true,
  release_date TEXT,
  pages INT DEFAULT 120,
  edition TEXT DEFAULT '2025 Revised Edition',
  isbn TEXT,
  description TEXT,
  full_description TEXT,
  is_bestseller BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  display_order INT DEFAULT 1,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

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

-- 2. Convert ID Column Type to TEXT (Supports both UUIDs and custom string IDs)
DO $$ 
BEGIN
  ALTER TABLE public.books ALTER COLUMN id SET DATA TYPE text USING id::text;
EXCEPTION WHEN OTHERS THEN 
  NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.batches ALTER COLUMN id SET DATA TYPE text USING id::text;
EXCEPTION WHEN OTHERS THEN 
  NULL;
END $$;

-- Ensure status constraint accepts both lowercase and title case
DO $$ 
BEGIN
  ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_status_check;
  ALTER TABLE public.batches ADD CONSTRAINT batches_status_check 
    CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled', 'Registration Open', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled', 'Full'));
EXCEPTION WHEN OTHERS THEN 
  NULL;
END $$;

-- 3. Grant Table and Sequence Privileges to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.books TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.batches TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Enable Row Level Security (RLS) with Permissive Sync Policies
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow portal write books" ON public.books;
DROP POLICY IF EXISTS "Public can view books" ON public.books;
DROP POLICY IF EXISTS "Public full access books" ON public.books;
CREATE POLICY "Public full access books" ON public.books
  FOR ALL TO authenticated, anon, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow portal write batches" ON public.batches;
DROP POLICY IF EXISTS "Public can view batches" ON public.batches;
DROP POLICY IF EXISTS "Public full access batches" ON public.batches;
CREATE POLICY "Public full access batches" ON public.batches
  FOR ALL TO authenticated, anon, service_role USING (true) WITH CHECK (true);

-- 5. Seed / Sync the 6 Books from the User Portal
INSERT INTO public.books (
  id, title, subtitle, standard, subject, author, publisher, cover_image, cover_image_url,
  price, original_price, publication_status, is_published, release_date, pages, edition,
  isbn, is_bestseller, is_featured, display_order, category, description, full_description
) VALUES
(
  '55706750-87d2-41a5-9466-ed7575a72153',
  'गणित प्रकाश: Standard 10 Mathematics Comprehensive Guide',
  'Complete Theory, Exemplar Problems, 10-Year Solved Board Papers & Formula Handbook',
  10, 'Mathematics', 'Prof. Rahul Deshmukh & Expert Faculty', 'e-MaziShaala Publications',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
  349.00, 499.00, 'published', true, 'October 2026', 420, '1st Edition (2026-27)',
  '978-93-89123-01-4', true, true, 1, 'Mathematics',
  'An authoritative, student-friendly textbook designed by senior examiners to help Standard 10 students achieve 95%+ in Mathematics.',
  'Includes bilingual Marathi-English explanations for complex theorems and 1,500+ solved practice problems.'
),
(
  '55706750-87d2-41a5-9466-ed7575a72154',
  'विज्ञान सेतू: Standard 10 Science & Technology Hand-Guide',
  'Part 1 & Part 2 with 3D Color Diagrams, Experiment Notes & Answer Blueprints',
  10, 'Science', 'Dr. Snehal Patil & Team', 'e-MaziShaala Publications',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80',
  379.00, 520.00, 'published', true, 'September 2026', 460, '1st Edition (2026-27)',
  '978-93-89123-02-1', true, true, 2, 'Science',
  'Simplifying complex Physics laws, Chemical equations, and Biological cycles.',
  'Features crisp memory maps, distinction tables, and practical exam blueprints.'
),
(
  '55706750-87d2-41a5-9466-ed7575a72155',
  'मराठी सुलभभारती संपूर्ण मार्गदर्शिका: इयत्ता ९ वी',
  'गद्य, पद्य, स्थूलवाचन, सविस्तर शब्दार्थ, भावार्थ व उपयोजित व्याकरण',
  9, 'Marathi', 'Mrs. Anjali Kulkarni', 'e-MaziShaala Publications',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
  299.00, 399.00, 'published', true, 'August 2026', 310, '1st Edition',
  '978-93-89123-03-8', false, false, 3, 'Marathi',
  'इयत्ता ९ वी च्या विद्यार्थ्यांसाठी मराठी भाषेवर प्रभुत्व मिळवून देणारे परिपूर्ण पुस्तक.',
  'सर्व धडे व कवितांचा भावार्थ, रसग्रहण, आणि १०० हून अधिक नमुना निबंध व पत्रलेखन.'
),
(
  '55706750-87d2-41a5-9466-ed7575a72156',
  'English Grammar & Writing Craftsman: Standard 8',
  'Master Vocabulary, Creative Composition, Comprehension & Spoken Idioms',
  8, 'English', 'Mr. Sachin Shinde', 'e-MaziShaala Publications',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',
  269.00, 380.00, 'published', true, 'November 2026', 280, '1st Edition',
  '978-93-89123-04-5', false, false, 4, 'English',
  'Build lifelong confidence in English grammar and creative writing.',
  'Contains real-world comprehension passages, story-building prompts, and letter drafting frameworks.'
),
(
  '55706750-87d2-41a5-9466-ed7575a72157',
  'इतिहास व राज्यशास्त्र: इयत्ता १० वी संक्षिप्त संदर्भग्रंथ',
  'ऐतिहासिक संकल्पना चित्रे, कालरेषा, नकाशे व बोर्ड प्रश्नोत्तरे',
  10, 'Social Science', 'Prof. Dinkar Sawant', 'e-MaziShaala Publications',
  'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
  280.00, 399.00, 'coming_soon', false, 'Coming Jan 2027', 340, 'First Edition (Pre-Order)',
  '978-93-89123-05-2', false, false, 5, 'Social Science',
  'इयत्ता १० वीच्या बोर्ड परीक्षेसाठी इतिहास, राज्यशास्त्र आणि भूगोलाची संपूर्ण उजळणी देणारे रंगीत पुस्तक.',
  'ऐतिहासिक घटनांची कालरेषा (Timelines) आणि नकाशा वाचनाचे विशेष तंत्र यात समाविष्ट आहे.'
),
(
  '55706750-87d2-41a5-9466-ed7575a72158',
  'Little Scientist Activity Book: Standard 6 & 7',
  '50 Safe Home Experiments, Science Puzzles, Crosswords & Fun Projects',
  6, 'Science', 'Dr. Snehal Patil', 'e-MaziShaala Publications',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
  240.00, 350.00, 'coming_soon', false, 'Coming Feb 2027', 200, 'First Edition',
  '978-93-89123-06-9', false, false, 6, 'Science',
  '50 Safe Home Experiments, Science Puzzles, Crosswords & Fun Projects.',
  'Turn everyday objects into exciting scientific instruments! A hands-on activity companion.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  is_published = EXCLUDED.is_published,
  cover_image_url = EXCLUDED.cover_image_url,
  updated_at = now();

-- 6. Seed / Sync the 6 Batches from the User Portal
INSERT INTO public.batches (
  id, name, course_name, description, start_date, end_date,
  registration_start, registration_end, price, total_seats, available_seats,
  status, is_published, is_featured
) VALUES
(
  'b0000000-0000-4000-8000-000000000001',
  'Class 10 Mathematics: Board Toppers Batch 2026-27',
  'Mathematics',
  'Master Class 10th Board Mathematics with conceptual clarity, shortcut techniques, step-by-step theorem proofs, and full solutions for State Board & CBSE curricula in Marathi & English bilingual medium.',
  '2026-11-20', '2027-02-28',
  '2026-11-01', '2026-11-19',
  999.00, 100, 85,
  'upcoming', true, true
),
(
  'b0000000-0000-4000-8000-000000000002',
  'Class 10 Science & Tech: Concept & Experiment Masterclass',
  'Science',
  'Comprehensive coverage of Physics, Chemistry, and Biology tailored for Standard 10 board success. Understand complex chemical reactions, gravitation, life processes, and heredity.',
  '2026-11-25', '2027-03-15',
  '2026-11-01', '2026-11-24',
  1199.00, 100, 68,
  'upcoming', true, true
),
(
  'b0000000-0000-4000-8000-000000000003',
  'Standard 9: Mathematics Foundation & Concept Builder',
  'Mathematics',
  'Strengthen your core analytical foundation in Standard 9 Mathematics. Specially designed to ease transitions into high school geometry, coordinate geometry, and statistics.',
  '2026-12-01', '2027-03-30',
  '2026-11-10', '2026-11-30',
  799.00, 100, 100,
  'upcoming', true, false
),
(
  'b0000000-0000-4000-8000-000000000004',
  'इयत्ता ८ वी: सुलभभारती संपूर्ण मराठी व व्याकरण विशेष बॅच',
  'Marathi',
  'इयत्ता ८ वी च्या विद्यार्थ्यांसाठी मराठी सुलभभारती अभ्यासक्रम, व्याकरण, पत्रलेखन, निबंधलेखन आणि कवितांचे रसग्रहण मराठी शिक्षकांकडून अतिशय सुंदर पद्धतीने शिकवले जाते.',
  '2026-11-22', '2027-02-15',
  '2026-11-01', '2026-11-21',
  599.00, 80, 45,
  'upcoming', true, true
),
(
  'b0000000-0000-4000-8000-000000000005',
  'Standard 7: English Grammar, Writing & Spoken Fluency',
  'English',
  'Complete syllabus coverage for Standard 7 English textbook along with foundational grammar, vocabulary building, comprehension techniques, and daily conversation practice.',
  '2026-12-05', '2027-03-20',
  '2026-11-15', '2026-12-04',
  699.00, 75, 75,
  'upcoming', true, false
),
(
  'b0000000-0000-4000-8000-000000000006',
  'Standard 6: Young Explorer Science & Discovery Club',
  'Science',
  'Inspire scientific curiosity in 6th graders. From plant life to celestial movements, simple machines, and electricity basics through colorful visuals and relatable real-life analogies.',
  '2026-11-28', '2027-01-30',
  '2026-11-10', '2026-11-27',
  599.00, 60, 60,
  'upcoming', true, false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  course_name = EXCLUDED.course_name,
  price = EXCLUDED.price,
  status = EXCLUDED.status,
  updated_at = now();
