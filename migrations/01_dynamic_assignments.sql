-- ==========================================
-- MIGRATION: Dynamic Assignments Update
-- ==========================================

-- 1. Remove the old strict check constraint
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_assignment_type_check;

-- 2. Rename assignment_type to category for better readability
ALTER TABLE public.assignments RENAME COLUMN assignment_type TO category;

-- 3. Add the new tracking_type column to dictate how the frontend renders the assignment
ALTER TABLE public.assignments ADD COLUMN tracking_type text CHECK (tracking_type IN ('checkbox', 'counter')) NOT NULL DEFAULT 'checkbox';

-- 4. Set is_daily to true by default (so they automatically recur every day)
ALTER TABLE public.assignments ALTER COLUMN is_daily SET DEFAULT true;
