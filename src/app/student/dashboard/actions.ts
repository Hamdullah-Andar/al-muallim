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
    throw new Error(`Failed to update progress: ${error.message} - ${error.details || ''}`)
  }

  // Refresh the student dashboard so the Progress Bar updates instantly
  revalidatePath('/student/dashboard')
}

export async function incrementZikrProgress(assignmentId: string, newCount: number, isCompleted: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const todayDate = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('student_progress')
    .upsert(
      {
        student_id: user.id,
        assignment_id: assignmentId,
        tracking_date: todayDate,
        is_completed: isCompleted,
        completed_value: newCount
      },
      { onConflict: 'student_id, assignment_id, tracking_date' }
    )

  if (error) {
    console.error("Zikr Upsert Error:", error)
    throw new Error(`Failed to update zikr progress: ${error.message} - ${error.details || ''}`)
  }

  revalidatePath('/student/dashboard')
}

export async function togglePrayerMask(assignmentId: string, maskValue: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const todayDate = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('student_progress')
    .upsert(
      {
        student_id: user.id,
        assignment_id: assignmentId,
        tracking_date: todayDate,
        is_completed: maskValue === 31, // 31 means all 5 prayers checked (1+2+4+8+16)
        completed_value: maskValue
      },
      { onConflict: 'student_id, assignment_id, tracking_date' }
    )

  if (error) throw new Error("Failed to update prayer progress")

  revalidatePath('/student/dashboard')
}

export async function updateMankiratProgress(assignmentId: string, sensesData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const todayDate = new Date().toISOString().split('T')[0]

  // We check if it is 100% completed by checking if all percentages are 0
  const isCompleted = Object.values(sensesData).every((val) => val === 0)

  const { error } = await supabase
    .from('student_progress')
    .upsert(
      {
        student_id: user.id,
        assignment_id: assignmentId,
        tracking_date: todayDate,
        is_completed: isCompleted,
        progress_data: sensesData
      },
      { onConflict: 'student_id, assignment_id, tracking_date' }
    )

  if (error) {
    console.error("Munkarat Upsert Error:", error)
    throw new Error(`Failed to update munkarat progress: ${error.message} - ${error.details || ''}`)
  }

  revalidatePath('/student/dashboard')
}
