-- ==========================================
-- MIGRATION: Fix Assignments RLS Policy
-- ==========================================

-- Allow users (teachers & students) to access their own personal assignments or class assignments
DROP POLICY IF EXISTS "Users can view own assignments" ON public.assignments;
CREATE POLICY "Users can view own assignments" ON public.assignments 
FOR SELECT USING (student_id = auth.uid() OR class_id IS NOT NULL);
