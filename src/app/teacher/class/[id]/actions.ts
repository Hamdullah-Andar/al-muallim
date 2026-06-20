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
