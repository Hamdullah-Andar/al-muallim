-- Add is_active column to classes table to allow archiving
ALTER TABLE public.classes 
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update existing classes to ensure they are active
UPDATE public.classes 
SET is_active = true 
WHERE is_active IS NULL;
