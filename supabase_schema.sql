-- ==========================================
-- AL-MUALLIM DATABASE SCHEMA
-- ==========================================
-- This file contains the complete database architecture for the Al-Muallim application.
-- It defines all tables, relationships (Foreign Keys), Security Policies (RLS), and automated triggers.

-- ==========================================
-- 1. PROFILES TABLE (Users & Roles)
-- ==========================================
-- This table stores all users (both Teachers and Students). 
-- It is linked directly to Supabase's built-in authentication system.
CREATE TABLE public.profiles (
  -- The ID matches the user's ID in Supabase Auth. If they delete their account, their profile is deleted (CASCADE).
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  -- The role determines if they see the Teacher Dashboard or Student Dashboard.
  role text CHECK (role IN ('teacher', 'student')) NOT NULL DEFAULT 'student',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) ensures users can only read/edit their own data (Policies will be added later via API).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 2. CLASSES TABLE
-- ==========================================
-- This table stores the classes created by Teachers.
CREATE TABLE public.classes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Every class must be owned by a Teacher. If the Teacher is deleted, their classes disappear (CASCADE).
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  -- This is the unique 6-character code students use to join (e.g., 'A7X9WQ'). Generated automatically!
  class_code text UNIQUE NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------
-- AUTOMATION: Generate Unique Class Code
-- ------------------------------------------
-- This PostgreSQL function intercepts any new class being created.
-- It automatically generates a random 6-character code, checks if it is truly unique, and assigns it.
CREATE OR REPLACE FUNCTION public.generate_unique_class_code()
RETURNS trigger AS $$
DECLARE
  new_code text;
  is_unique boolean;
BEGIN
  -- If the frontend already provided a code, use that one instead.
  IF NEW.class_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Loop until we find a code that doesn't exist in the database yet.
  LOOP
    -- Generate a random 6-character string using uppercase letters and numbers.
    new_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check the database to see if this code is already taken.
    SELECT NOT EXISTS (
      SELECT 1 FROM public.classes WHERE class_code = new_code
    ) INTO is_unique;
    
    -- If it is unique, break the loop! Otherwise, try again.
    EXIT WHEN is_unique;
  END LOOP;
  
  -- Assign the newly generated code to the class.
  NEW.class_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This trigger connects the function above to the 'classes' table so it runs BEFORE every insert.
CREATE TRIGGER ensure_unique_class_code
  BEFORE INSERT ON public.classes
  FOR EACH ROW EXECUTE PROCEDURE public.generate_unique_class_code();


-- ==========================================
-- 3. CLASS_STUDENTS TABLE (Join Table)
-- ==========================================
-- This table connects Students to the Classes they have joined.
-- A student can join many classes, and a class can have many students (Many-to-Many relationship).
CREATE TABLE public.class_students (
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- A student can only join the same class once (Composite Primary Key).
  PRIMARY KEY (class_id, student_id)
);

ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 4. BOOKS TABLE
-- ==========================================
-- Teachers can upload books (PDFs) for students to read as assignments.
CREATE TABLE public.books (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text DEFAULT 'Class Instructor',
  category text DEFAULT 'General Reading',
  pages integer DEFAULT 100,
  description text DEFAULT 'Class reading material provided by your instructor.',
  -- The URL pointing to where the PDF is stored in Supabase Storage.
  file_url text NOT NULL,
  -- Which teacher uploaded this book?
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 5. ASSIGNMENTS TABLE
-- ==========================================
-- This is the core table where Teachers assign tasks (or students create personal tasks).
CREATE TABLE public.assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- If class_id is NULL, this is a personal assignment created by a student for themselves.
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE, 
  -- If student_id is set, it means this assignment is specifically for one person (Personal task).
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, 
  title text NOT NULL,
  
  -- The type of homework dictates how the frontend renders it.
  assignment_type text CHECK (assignment_type IN ('zikr', 'reading', 'memorization', 'prayer', 'tarjoma', 'custom')) NOT NULL,
  
  -- JSONB is the superpower column. It stores the specific rules for the assignment type.
  -- Example Zikr: {"phrase": "Astaghfirullah", "target": 200}
  -- Example Reading: {"book_id": "uuid", "start_page": 10, "end_page": 15}
  content jsonb DEFAULT '{}'::jsonb NOT NULL,
  
  due_date timestamp with time zone,
  -- Is this a one-time assignment, or a daily habit?
  is_daily boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 6. STUDENT_PROGRESS TABLE
-- ==========================================
-- Tracks the daily progress of a student on a specific assignment. Used to calculate Streaks!
CREATE TABLE public.student_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  
  -- The specific day this progress applies to.
  tracking_date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- How many Zikrs or Pages have they completed so far today?
  completed_value integer DEFAULT 0, 
  
  -- Used for complex tracking like the 5 senses of Munkarat
  progress_data jsonb DEFAULT '{}'::jsonb,
  
  -- Is the task 100% finished for the day?
  is_completed boolean DEFAULT false NOT NULL,
  
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- A student can only have ONE progress record per assignment per day.
  UNIQUE (student_id, assignment_id, tracking_date)
);

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 7. CLASS_DISCUSSIONS & ANNOUNCEMENTS
-- ==========================================
-- Allows students to chat, and Teachers to post pinned Announcements.
CREATE TABLE public.class_discussions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  -- If TRUE, this is rendered at the top of the chat in a different color.
  is_announcement boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.class_discussions ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 8. ACHIEVEMENTS TABLE (Badges)
-- ==========================================
-- Stores the badges a student has earned (e.g., "Flawless Week in Tahajud").
CREATE TABLE public.achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL, 
  description text,
  earned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------
-- AUTOMATION: Auto-Create Profile on Signup
-- ------------------------------------------
-- When a user signs up using the Registration UI, Supabase creates an 'auth.users' record.
-- This function listens for that event and automatically creates a corresponding 'profiles' record.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    -- If they forgot to select a role, default them to 'student' so the app doesn't crash.
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This trigger runs the function above every time a new row is added to auth.users.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
