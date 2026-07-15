'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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
  let content = {}
  if (trackingType === 'counter') {
    content = {
      target: parseInt(formData.get('target') as string),
      unit: formData.get('unit') as string
    }
  }

  // Insert into our newly migrated dynamic assignments table
  const { error } = await supabase
    .from('assignments')
    .insert([
      {
        class_id: classId,
        category,
        title,
        tracking_type: trackingType,
        content,
        is_daily: true // Automatically regenerates every day!
      }
    ])

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to create assignment')
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
