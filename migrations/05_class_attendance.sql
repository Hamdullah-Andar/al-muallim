-- Migration: 05_class_attendance.sql
-- Create class_attendance table for tracking daily student attendance

CREATE TABLE IF NOT EXISTS public.class_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_class_date_attendance UNIQUE (class_id, student_id, attendance_date)
);

-- Enable RLS
ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view attendance for their classes"
    ON public.class_attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE public.classes.id = public.class_attendance.class_id
            AND public.classes.teacher_id = auth.uid()
        )
        OR student_id = auth.uid()
    );

CREATE POLICY "Teachers can insert/update attendance for their classes"
    ON public.class_attendance FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE public.classes.id = public.class_attendance.class_id
            AND public.classes.teacher_id = auth.uid()
        )
    );

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_class_attendance_class_date ON public.class_attendance(class_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_class_attendance_student ON public.class_attendance(student_id);
