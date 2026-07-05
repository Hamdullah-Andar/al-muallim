'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logZikrSession(
  studentId: string, 
  assignmentId: string, 
  count: number, 
  date: string,
  classId: string
) {
  const supabase = await createClient()

  // Find if progress already exists for this date
  const { data: existingProgress } = await supabase
    .from('student_progress')
    .select('id, completed_value')
    .eq('student_id', studentId)
    .eq('assignment_id', assignmentId)
    .eq('tracking_date', date)
    .single()

  let newCompletedValue = count
  if (existingProgress) {
    newCompletedValue = (existingProgress.completed_value || 0) + count
  }

  // Get the target to see if it's fully completed
  const { data: assignment } = await supabase
    .from('assignments')
    .select('content')
    .eq('id', assignmentId)
    .single()
  
  const target = assignment?.content?.target || 0
  const isCompleted = newCompletedValue >= target

  if (existingProgress) {
    await supabase
      .from('student_progress')
      .update({
        completed_value: newCompletedValue,
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id)
  } else {
    await supabase
      .from('student_progress')
      .insert({
        student_id: studentId,
        assignment_id: assignmentId,
        tracking_date: date,
        completed_value: newCompletedValue,
        is_completed: isCompleted
      })
  }

  revalidatePath(`/student/class/${classId}`)
  return { success: true }
}

export async function togglePrayer(
  studentId: string,
  assignmentId: string,
  prayerName: string,
  checked: boolean,
  date: string,
  classId: string
) {
  const supabase = await createClient()

  // Find existing progress
  const { data: existingProgress } = await supabase
    .from('student_progress')
    .select('id, progress_data, completed_value')
    .eq('student_id', studentId)
    .eq('assignment_id', assignmentId)
    .eq('tracking_date', date)
    .single()

  const currentData = existingProgress?.progress_data || {}
  
  // ============================================================================
  // BITMASK HYDRATION (Crucial for Dashboard Sync)
  // The Analytics Dashboard reads prayer completion using a bitmask.
  // Fajr = 1, Dhuhr = 2, Asr = 4, Maghrib = 8, Isha = 16.
  // If `progress_data` is empty but `completed_value` exists, we must decode
  // the bitmask back into a boolean object so the UI can toggle it properly.
  // ============================================================================
  if (Object.keys(currentData).length === 0 && existingProgress?.completed_value) {
    const m = existingProgress.completed_value;
    if ((m & 1) !== 0) currentData['Fajr'] = true;
    if ((m & 2) !== 0) currentData['Dhuhr'] = true;
    if ((m & 4) !== 0) currentData['Asr'] = true;
    if ((m & 8) !== 0) currentData['Maghrib'] = true;
    if ((m & 16) !== 0) currentData['Isha'] = true;
  }

  const newData = { ...currentData, [prayerName]: checked }
  
  // ============================================================================
  // BITMASK CALCULATION
  // We re-calculate the mathematical bitmask from the updated JSON object.
  // This ensures that when we save `completed_value`, the global Dashboard
  // can instantly read it correctly without parsing JSON.
  // ============================================================================
  let mask = 0;
  if (newData['Fajr']) mask |= 1;
  if (newData['Dhuhr']) mask |= 2;
  if (newData['Asr']) mask |= 4;
  if (newData['Maghrib']) mask |= 8;
  if (newData['Isha']) mask |= 16;
  
  // 31 is the sum of 1 + 2 + 4 + 8 + 16 (All 5 prayers completed)
  const isCompleted = mask === 31;

  if (existingProgress) {
    await supabase
      .from('student_progress')
      .update({
        progress_data: newData,
        completed_value: mask,
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id)
  } else {
    await supabase
      .from('student_progress')
      .insert({
        student_id: studentId,
        assignment_id: assignmentId,
        tracking_date: date,
        progress_data: newData,
        completed_value: mask,
        is_completed: isCompleted
      })
  }

  revalidatePath(`/student/class/${classId}`)
  return { success: true }
}
