import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import TeacherSidebar from '@/components/teacher/TeacherSidebar'

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
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-background">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white dark:bg-black border-r border-black/5 dark:border-white/5 hidden md:flex flex-col shadow-sm z-20">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-800 dark:text-primary-400 font-arabic tracking-wide">Al-Mu'allim</h1>
          <p className="text-xs opacity-50 font-bold uppercase tracking-widest mt-1">Teacher Portal</p>
        </div>
        
        <TeacherSidebar />
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto relative">
        
        {/* Top Header */}
        <header className="h-20 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-end px-8">
            <div className="flex items-center gap-6">
              <button className="opacity-60 hover:opacity-100 transition-opacity">
                {/* Bell Icon */}
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </button>
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-tight">{profile?.full_name}</p>
                  <p className="text-xs opacity-60">Teacher</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-800 dark:text-primary-200 font-bold border border-primary-200 dark:border-primary-800">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'T'}
                </div>
              </div>
            </div>
        </header>

        {/* Page Content Rendered Here */}
        <div className="p-8">
          {children}
        </div>

      </main>
    </div>
  )
}
