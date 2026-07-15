import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BookDetailClient from './BookDetailClient'

export const dynamic = 'force-dynamic'

export default async function StudentBookDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }> | { id: string }
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}) {
  const resolvedParams = 'then' in params ? await params : params
  const { id } = resolvedParams

  const resolvedSearchParams = searchParams ? ('then' in searchParams ? await searchParams : searchParams) : {}
  const assignmentId = typeof resolvedSearchParams?.assignmentId === 'string' ? resolvedSearchParams.assignmentId : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Try fetching dynamic book if stored in books table
  let initialBookData = null
  try {
    const { data: dbBook } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()
    if (dbBook) {
      initialBookData = dbBook
    }
  } catch (err) {
    console.warn('Could not fetch book from books table by ID:', err)
  }

  return (
    <BookDetailClient
      bookId={id}
      user={user}
      profile={profile}
      initialAssignmentId={assignmentId}
      initialBookData={initialBookData}
    />
  )
}
