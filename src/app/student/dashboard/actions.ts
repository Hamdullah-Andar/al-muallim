'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleAssignmentProgress(assignmentId: string, isCompleted: boolean, completedValue: number | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  // Generate today's date string (YYYY-MM-DD)
  const todayDate = new Date().toISOString().split('T')[0]

  // Use Upsert! Because of our UNIQUE constraint in the DB, this safely inserts OR updates perfectly!
  const { error } = await supabase
    .from('student_progress')
    .upsert(
      {
        student_id: user.id,
        assignment_id: assignmentId,
        tracking_date: todayDate,
        is_completed: isCompleted,
        completed_value: completedValue || 0
      },
      { onConflict: 'student_id, assignment_id, tracking_date' }
    )

  if (error) {
    console.error("Upsert Error:", error)
    throw new Error("Failed to update progress")
  }

  // Refresh the student dashboard so the Progress Bar updates instantly
  revalidatePath('/student/dashboard')
}
