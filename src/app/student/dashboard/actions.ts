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

  // Refresh both student dashboard and analytics so data is always synced in real-time
  revalidatePath('/student/dashboard')
  revalidatePath('/student/analytics')
  revalidatePath('/student/assignments')
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
  revalidatePath('/student/analytics')
  revalidatePath('/student/assignments')
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
  revalidatePath('/student/analytics')
  revalidatePath('/student/assignments')
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
  revalidatePath('/student/analytics')
  revalidatePath('/student/assignments')
}

export async function syncLibraryPortionRead(isQuranBook: boolean, bookId: string, targetAssignmentId?: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const todayDate = new Date().toISOString().split('T')[0]

  // Fetch student's assignments to find matching reading/quran tasks across all their classes
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')

  if (!assignments || assignments.length === 0) return

  // Find all matching reading/quran assignments for this student
  const matchedList = assignments.filter(a => {
    const titleLower = (a.title || '').toLowerCase()
    const linked = a.content?.linkedBookId || a.linked_book_id
    if (isQuranBook) {
      return linked === 'quran' || titleLower.includes('quran') || titleLower.includes('recit') || titleLower.includes('surah') || titleLower.includes('juz') || titleLower.includes('ayah')
    }
    return linked === bookId || (bookId === '7' && (titleLower.includes('tafsir') || titleLower.includes('anwar'))) || (bookId === '9' && (titleLower.includes('hadith') || titleLower.includes('riyad')))
  })

  if (matchedList.length === 0) return

  // Determine target assignment:
  // 1. If exact targetAssignmentId was passed from URL query parameter (clicked from a specific card), use that exact assignment!
  let matched = targetAssignmentId ? matchedList.find(a => a.id === targetAssignmentId) : null

  // 2. If no targetAssignmentId (or not found), check today's progress across all matched assignments
  // and pick the FIRST INCOMPLETE assignment across any class!
  if (!matched) {
    const matchedIds = matchedList.map(a => a.id)
    const { data: progressRecords } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', user.id)
      .in('assignment_id', matchedIds)
      .eq('tracking_date', todayDate)

    const progMap: Record<string, any> = {}
    progressRecords?.forEach(p => {
      progMap[p.assignment_id] = p
    })

    // Pick the first matching assignment where completed_value < target (or not completed)
    matched = matchedList.find(a => {
      const prog = progMap[a.id]
      const target = a.content?.target || a.target_count || 1
      const current = prog?.completed_value || 0
      return current < target && !prog?.is_completed
    })

    // If all matching assignments are already completed, fallback to the first matched assignment
    if (!matched) {
      matched = matchedList[0]
    }
  }

  if (!matched) return

  // Get current progress for today for our selected assignment
  const { data: existingProg } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('assignment_id', matched.id)
    .eq('tracking_date', todayDate)
    .maybeSingle()

  const currentVal = existingProg?.completed_value || 0
  const newVal = currentVal + 1
  const target = matched.content?.target || matched.target_count || 1
  const isCompleted = newVal >= target

  const { error } = await supabase
    .from('student_progress')
    .upsert(
      {
        student_id: user.id,
        assignment_id: matched.id,
        tracking_date: todayDate,
        is_completed: isCompleted,
        completed_value: newVal
      },
      { onConflict: 'student_id, assignment_id, tracking_date' }
    )

  if (error) {
    console.error("Library Sync Upsert Error:", error)
    throw new Error(`Failed to sync progress: ${error.message}`)
  }

  revalidatePath('/student/dashboard')
  revalidatePath('/student/analytics')
  revalidatePath('/student/assignments')
  revalidatePath('/student/library')
}
