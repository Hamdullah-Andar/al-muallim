import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import StudentSidebar from '@/components/student/StudentSidebar'

export default async function StudentLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') {
    redirect('/teacher/dashboard')
  }

  return (
    <div className="min-h-screen flex bg-[#fbfbfb] dark:bg-background font-sans">
      {/* LEFT SIDEBAR NAVIGATION */}
      <StudentSidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0 overflow-y-auto overflow-x-hidden relative">
        {/* Mobile Header (Shown only on small screens) */}
        <header className="lg:hidden h-16 border-b border-black/5 bg-white flex items-center px-4 justify-between sticky top-0 z-20">
          <h1 className="font-bold text-primary-800">Al-Mu'allim</h1>
          <button className="p-2 bg-gray-100 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
        </header>
        
        {/* Page Content */}
        {children}
        {modal}
      </main>
    </div>
  )
}
