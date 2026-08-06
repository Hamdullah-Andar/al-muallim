'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateClassSchedule(
  classId: string,
  scheduleDays: string[],
  scheduleTime: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authorized')

  const { error } = await supabase
    .from('classes')
    .update({
      schedule_days: scheduleDays,
      schedule_time: scheduleTime || null
    })
    .eq('id', classId)
    .eq('teacher_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath('/teacher/dashboard')
  revalidatePath('/teacher/classes')
}

export async function removeStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authorized')

  const { data: classRow } = await supabase
    .from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).single()
  if (!classRow) throw new Error('Not authorized')

  const { error } = await supabase
    .from('class_students')
    .update({ is_active: false })
    .eq('class_id', classId)
    .eq('student_id', studentId)

  if (error) throw new Error(error.message)
  revalidatePath(`/teacher/class/${classId}`)
}

export async function restoreStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authorized')

  const { data: classRow } = await supabase
    .from('classes').select('id').eq('id', classId).eq('teacher_id', user.id).single()
  if (!classRow) throw new Error('Not authorized')

  const { error } = await supabase
    .from('class_students')
    .update({ is_active: true })
    .eq('class_id', classId)
    .eq('student_id', studentId)

  if (error) throw new Error(error.message)
  revalidatePath(`/teacher/class/${classId}`)
}

export async function createAssignment(formData: FormData) {
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const classId = formData.get('classId') as string
  const category = formData.get('category') as string
  const title = formData.get('title') as string
  const trackingType = formData.get('trackingType') as string
  
  // Build the dynamic JSONB content based on the tracking type
  let content: any = { category } // Preserve original category name (e.g. 'Nawafil')
  if (trackingType === 'counter') {
    content = {
      ...content,
      target: parseInt(formData.get('target') as string) || 1,
      unit: (formData.get('unit') as string) || 'Times',
      linkedBookId: (formData.get('linkedBookId') as string) || null,
      externalUrl: (formData.get('externalUrl') as string) || null,
      trackingType: 'counter'
    }
  } else if (trackingType === 'percentage') {
    content = {
      ...content,
      target: 0,
      unit: '%',
      startValue: 100,
      trackingType: 'percentage'
    }
  } else {
    content.trackingType = trackingType
  }

  // Insert into our newly migrated dynamic assignments table
  const { error } = await supabase
    .from('assignments')
    .insert([
      {
        class_id: classId,
        category,
        title,
        tracking_type: trackingType === 'percentage' ? 'counter' : trackingType,
        // target and unit are stored inside the content JSONB column (content.target, content.unit)
        // ZikrTrackerRow reads from assignment.content?.target to get the correct value
        content,
        is_daily: true // Automatically regenerates every day!
      }
    ])

  if (error) {
    console.error('Database Error:', error)
    throw new Error(`Database Error: ${error.message || JSON.stringify(error)}`)
  }

  // Refresh the page so the new assignment shows up instantly
  revalidatePath(`/teacher/class/${classId}`)
}

export async function uploadClassBook(formData: FormData) {
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const classId = formData.get('classId') as string
  const title = formData.get('title') as string
  const author = (formData.get('author') as string) || 'Class Instructor'
  const category = (formData.get('category') as string) || 'Quran & Tafsir'
  const pagesStr = formData.get('pages') as string
  const pages = pagesStr ? parseInt(pagesStr, 10) : 100
  const description = (formData.get('description') as string) || 'Class reading material provided by your instructor.'
  let fileUrl = (formData.get('fileUrl') as string) || ''

  const pdfFile = formData.get('pdfFile') as File | null
  if (pdfFile && pdfFile.size > 0 && pdfFile.name !== 'undefined') {
    const fileName = `class_${classId}/${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('library-pdfs')
      .upload(fileName, pdfFile, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError)
      // Fallback or re-throw if no URL
      if (!fileUrl) throw new Error(`Could not upload PDF: ${uploadError.message}`)
    } else if (uploadData) {
      const { data: { publicUrl } } = supabase.storage
        .from('library-pdfs')
        .getPublicUrl(fileName)
      fileUrl = publicUrl
    }
  }

  if (!fileUrl) {
    fileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }

  const { error } = await supabase
    .from('books')
    .insert([
      {
        class_id: classId,
        title,
        author,
        category,
        pages,
        description,
        file_url: fileUrl,
        uploaded_by: user.id
      }
    ])

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to upload book: ' + error.message)
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath('/student/library')
}

export async function deleteClassBook(bookId: string, classId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)
    .eq('uploaded_by', user.id)

  if (error) {
    console.error('Delete Book Error:', error)
    throw new Error('Failed to delete book')
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath('/student/library')
}

export async function toggleClassActiveStatus(classId: string, isActive: boolean) {
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  // Ensure the user owns this class
  const { data: classData } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', classId)
    .single()
    
  if (classData?.teacher_id !== user.id) {
    throw new Error("Not authorized to modify this class")
  }

  const { error } = await supabase
    .from('classes')
    .update({ is_active: isActive })
    .eq('id', classId)

  if (error) {
    console.error('Update Class Status Error:', error)
    throw new Error('Failed to update class status')
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath('/teacher/dashboard')
}

export async function deleteAssignment(assignmentId: string, classId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authorized")

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) {
    console.error('Delete Assignment Error:', error)
    throw new Error('Failed to delete assignment')
  }

  if (classId) {
    revalidatePath(`/teacher/class/${classId}`)
  }
  revalidatePath('/teacher/assignments')
}
