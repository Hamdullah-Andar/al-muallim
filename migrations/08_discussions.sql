-- ==========================================
-- 08. DISCUSSIONS FEATURE ENHANCEMENT
-- ==========================================

-- 1. Enhance existing class_discussions table
ALTER TABLE public.class_discussions 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false NOT NULL;

-- 2. Create discussion_replies table
CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.class_discussions(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for discussion_replies
-- View: Anyone authenticated can view (class access is checked at app level, but we can keep it open or restrict to enrolled/teachers if needed. For now, authenticated is safe if app routes protect the class)
DROP POLICY IF EXISTS "Authenticated users can view replies" ON public.discussion_replies;
CREATE POLICY "Authenticated users can view replies" 
  ON public.discussion_replies FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Insert: Authenticated users can insert replies
DROP POLICY IF EXISTS "Authenticated users can insert replies" ON public.discussion_replies;
CREATE POLICY "Authenticated users can insert replies" 
  ON public.discussion_replies FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Delete: Users can delete own replies
DROP POLICY IF EXISTS "Users can delete own replies" ON public.discussion_replies;
CREATE POLICY "Users can delete own replies" 
  ON public.discussion_replies FOR DELETE 
  USING (auth.uid() = author_id);

-- Update: Users can update own replies
DROP POLICY IF EXISTS "Users can update own replies" ON public.discussion_replies;
CREATE POLICY "Users can update own replies" 
  ON public.discussion_replies FOR UPDATE 
  USING (auth.uid() = author_id);
