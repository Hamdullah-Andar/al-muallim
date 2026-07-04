import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ClassesClient from './ClassesClient'

export const dynamic = 'force-dynamic'

export default async function JoinedClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch the user's profile to get name and id for the header
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // 1. Fetch Enrolled Classes
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('class_id, classes(name, description, teacher_id)')
    .eq('student_id', user.id)

  const rawClasses = enrollments || []
  
  // 2. Fetch Teacher Profiles
  const teacherIds = Array.from(new Set(rawClasses.map((e: any) => e.classes?.teacher_id).filter(Boolean)))
  
  let teacherMap: Record<string, string> = {}
  if (teacherIds.length > 0) {
    const { data: teachers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', teacherIds as string[])
      
    teacherMap = (teachers || []).reduce((acc: Record<string, string>, t: any) => {
      acc[t.id] = t.full_name || 'Instructor'
      return acc
    }, {})
  }

  // 3. Prepare the enriched classes array with mock categories and images
  const mockCategories = ["Quranic Studies", "Language", "History", "Spirituality"]
  const mockImages = [
    "https://placehold.co/600x400/092B2B/FFF?text=Quranic+Studies",
    "https://placehold.co/600x400/0f4c4c/FFF?text=Language",
    "https://placehold.co/600x400/156969/FFF?text=History",
    "https://placehold.co/600x400/1e8989/FFF?text=Spirituality"
  ]

  const mappedClasses = rawClasses.map((e: any, index: number) => {
    // Generate a stable pseudo-random progress between 0 and 100 based on index
    const progress = Math.abs(Math.sin(index + 1) * 100).toFixed(0)

    return {
      id: e.class_id,
      name: e.classes?.name || 'Unknown Class',
      description: e.classes?.description || '',
      teacherId: e.classes?.teacher_id,
      teacherName: teacherMap[e.classes?.teacher_id] || 'Dr. Instructor',
      category: mockCategories[index % mockCategories.length],
      imageUrl: mockImages[index % mockImages.length],
      progress: parseInt(progress, 10)
    }
  })

  return (
    <ClassesClient 
      classes={mappedClasses}
      userId={user.id}
      userName={profile?.full_name || 'Student'}
    />
  )
}
