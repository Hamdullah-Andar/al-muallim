-- ==========================================
-- MIGRATION: Class-Specific Books & Library
-- ==========================================
-- Run this script in your Supabase SQL Editor to add class link & metadata columns to the books table.

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS author text DEFAULT 'Class Instructor',
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'General Reading',
  ADD COLUMN IF NOT EXISTS pages integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS description text DEFAULT 'Class reading material provided by your instructor.';

-- Create index for faster querying by class_id
CREATE INDEX IF NOT EXISTS idx_books_class_id ON public.books(class_id);
