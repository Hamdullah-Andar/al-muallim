import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LibraryClient from './LibraryClient'

export const dynamic = 'force-dynamic'

export default async function StudentLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 1. Fetch classes the student has joined
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', user.id)

  const classIds = enrollments?.map(e => e.class_id) || []

  // 2. Fetch books assigned to those classes or global books
  let booksQuery = supabase.from('books').select('*').order('created_at', { ascending: false })
  
  // Try querying with class_id filter if the column exists in database
  let books: any[] = []
  try {
    if (classIds.length > 0) {
      const { data, error } = await booksQuery.or(`class_id.is.null,class_id.in.(${classIds.join(',')})`)
      if (!error && data) {
        books = data
      } else if (error) {
        const { data: fallbackData } = await supabase.from('books').select('*').order('created_at', { ascending: false })
        if (fallbackData) books = fallbackData
      }
    } else {
      const { data, error } = await booksQuery.is('class_id', null)
      if (!error && data) {
        books = data
      } else if (error) {
        const { data: fallbackData } = await supabase.from('books').select('*').order('created_at', { ascending: false })
        if (fallbackData) books = fallbackData
      }
    }
  } catch (err) {
    const { data: fallbackData } = await supabase.from('books').select('*').order('created_at', { ascending: false })
    if (fallbackData) books = fallbackData
  }

  // If books were fetched from database, map them into initial resources format
  const mappedResources = books.map((b: any) => ({
    id: b.id,
    title: b.title || 'Untitled Book',
    author: b.author || 'Class Instructor',
    category: b.category || 'Quran & Tafsir',
    pages: b.pages || 100,
    rating: 5.0,
    coverColor: 'from-[#193a2c] to-[#0c1f17]',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    badgeText: (b.category || 'CLASS RESOURCE').toUpperCase(),
    description: b.description || 'Assigned reading resource provided by your class instructor.',
    file_url: b.file_url
  }))

  return (
    <LibraryClient
      user={user}
      profile={profile}
      initialResources={mappedResources}
    />
  )
}
