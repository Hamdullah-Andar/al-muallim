import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import TeacherLayoutClient from '@/components/teacher/TeacherLayoutClient'

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify role (Extra security layer)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') {
    redirect('/dashboard') // Sends students back to router
  }

  return (
    <TeacherLayoutClient profileName={profile?.full_name || 'Teacher'}>
      {children}
    </TeacherLayoutClient>
  )
}
