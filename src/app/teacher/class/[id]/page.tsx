import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CreateAssignmentButton from '@/components/CreateAssignmentButton'

export default async function ClassDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the class and ensure this teacher owns it
  const { data: classData } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .single()

  if (!classData || classData.teacher_id !== user?.id) {
    notFound()
  }

  // Fetch students enrolled in this class
  const { data: students } = await supabase
    .from('class_students')
    .select(`
      id,
      student_id,
      profiles!student_id ( full_name )
    `)
    .eq('class_id', id)

  // Fetch active assignments for this class
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER HERO */}
      <div className="bg-primary-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <Link href="/teacher/dashboard" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span className="text-sm font-bold tracking-wider uppercase">Back to Dashboard</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-arabic tracking-tight">{classData.name}</h1>
            <p className="text-lg opacity-80 max-w-2xl leading-relaxed">
              {classData.description || 'Welcome to your class dashboard. From here you can manage students, assignments, and track progress.'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center min-w-[200px] shadow-inner">
            <p className="text-xs uppercase tracking-widest font-bold opacity-70 mb-2">Class Code</p>
            <p className="text-4xl font-mono font-bold tracking-[0.2em]">{classData.class_code}</p>
          </div>
        </div>
        
        {/* Decorative background shapes */}
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute right-64 -bottom-32 w-80 h-80 bg-primary-500/30 rounded-full blur-3xl"></div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-8 border-b border-black/10 dark:border-white/10 px-4 overflow-x-auto">
        <button className="pb-4 font-bold text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 whitespace-nowrap">Overview</button>
        <button className="pb-4 font-bold opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap">Students ({students?.length || 0})</button>
        <button className="pb-4 font-bold opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap">Assignments</button>
        <button className="pb-4 font-bold opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap">Discussions</button>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Students Roster */}
          <div className="bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Student Roster</h2>
                <p className="text-sm opacity-60 font-medium mt-1">Manage the students enrolled in this class.</p>
              </div>
              <button className="text-sm font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">
                Invite
              </button>
            </div>
            
            {students && students.length > 0 ? (
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {students.map((student) => (
                  <div key={student.id} className="p-6 md:px-8 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-lg">
                        {/* @ts-ignore */}
                        {student.profiles?.full_name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        {/* @ts-ignore */}
                        <p className="font-bold text-lg">{student.profiles?.full_name || 'Unknown Student'}</p>
                        <p className="text-sm opacity-60 font-medium">Joined recently</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">0%</p>
                      <p className="text-xs opacity-60 font-medium uppercase tracking-wider">Completion</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 md:p-20 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">No Students Yet</h3>
                <p className="text-base opacity-70 max-w-md mx-auto mb-8">
                  Your class is currently empty. Share the Class Code <strong className="font-mono text-primary-600 dark:text-primary-400">{classData.class_code}</strong> with your students so they can join!
                </p>
                <button className="bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:hover:bg-primary-800 text-primary-800 dark:text-primary-200 px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy Class Code
                </button>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <CreateAssignmentButton classId={id} />
              
              <button className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold transition-colors group">
                <div className="bg-white dark:bg-black/50 shadow-sm p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-lg">Post Announcement</p>
                  <p className="text-xs opacity-70 font-medium">Notify all students</p>
                </div>
              </button>
            </div>
          </div>

          {/* Active Assignments Panel */}
          <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Active Assignments</h2>
            
            {assignments && assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="p-4 rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-between hover:border-primary-500 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          {assignment.category}
                        </span>
                        {assignment.tracking_type === 'counter' && (
                          <span className="text-xs opacity-60 font-medium">
                            Target: {assignment.content.target} {assignment.content.unit}
                          </span>
                        )}
                        {assignment.tracking_type === 'checkbox' && (
                          <span className="text-xs opacity-60 font-medium">Daily Checkbox</span>
                        )}
                      </div>
                      <p className="font-bold text-lg">{assignment.title}</p>
                    </div>
                    
                    <button className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-2 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl">
                <svg className="w-12 h-12 text-black/20 dark:text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="text-lg font-bold mb-1">No assignments yet</h3>
                <p className="opacity-60 text-sm font-medium">Create your first daily assignment above.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
