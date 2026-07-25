-- ==========================================
-- MIGRATION: Book Reading Progress Tracking
-- ==========================================
-- Run this script in your Supabase SQL Editor to track independent book reading progress across all books (uploaded PDFs, Quran, and library classics).

CREATE TABLE IF NOT EXISTS public.book_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id text NOT NULL,
  book_title text,
  file_url text,
  current_page integer DEFAULT 1,
  total_pages integer DEFAULT 100,
  completed_portions integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  last_read_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, book_id)
);

-- Enable RLS
ALTER TABLE public.book_progress ENABLE ROW LEVEL SECURITY;

-- Policies for book_progress
DROP POLICY IF EXISTS "Students can view their own book progress" ON public.book_progress;
CREATE POLICY "Students can view their own book progress"
  ON public.book_progress FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert/update their own book progress" ON public.book_progress;
CREATE POLICY "Students can insert/update their own book progress"
  ON public.book_progress FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Create index for fast retrieval
CREATE INDEX IF NOT EXISTS idx_book_progress_student ON public.book_progress(student_id, last_read_at DESC);
