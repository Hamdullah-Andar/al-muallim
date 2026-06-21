import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AssignmentCard from '@/components/student/AssignmentCard'
import { calculateStudentStats } from '@/utils/gamification'
import { getNextPrayer } from '@/utils/prayerTimes'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch Profile Data
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // 2. Fetch the classes this student is enrolled in
  const { data: enrollments } = await supabase.from('class_students').select('class_id, classes(name, teacher_id)').eq('student_id', user.id)
  const classIds = enrollments?.map(e => e.class_id) || []
  
  // Also keep full class objects for the "Joined Classes" section
  const joinedClasses = enrollments?.map((e: any) => ({
    id: e.class_id,
    name: e.classes?.name,
    teacherId: e.classes?.teacher_id
  })) || []

  // 3. Fetch all active assignments for those classes
  let assignments: any[] = []
  if (classIds.length > 0) {
    const { data: classAssignments } = await supabase
      .from('assignments')
      .select('*, classes(name)')
      .in('class_id', classIds)
      .eq('is_daily', true)
    assignments = classAssignments || []
  }

  // 4. Fetch the student's progress for TODAY
  const todayDate = new Date().toISOString().split('T')[0]
  
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('tracking_date', todayDate)

  // Create a quick lookup map so we know which assignments are completed
  const progressMap: Record<string, any> = {}
  progress?.forEach(p => {
    progressMap[p.assignment_id] = p
  })

  // 5. Group assignments cleanly by category
  const groupedAssignments = assignments.reduce((acc: any, assignment) => {
    if (!acc[assignment.category]) acc[assignment.category] = []
    acc[assignment.category].push(assignment)
    return acc
  }, {})
  
  const categories = Object.keys(groupedAssignments).sort()

  // Calculate high-level progress stats for TODAY
  const totalTasks = assignments.length
  const completedTasksToday = progress?.filter(p => p.is_completed).length || 0
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasksToday / totalTasks) * 100)

  // Fetch ALL-TIME Gamification Stats & Live Prayer Times
  const { currentStreak, completedTasks } = await calculateStudentStats(supabase, user.id);
  const nextPrayer = await getNextPrayer();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* 1. Header with Greeting & Next Prayer Widget */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Assalamu Alaikum, {profile?.full_name?.split(' ')[0] || 'Student'}</h1>
          <p className="opacity-70 text-sm">Your journey today is {completionPercentage}% complete. Keep going!</p>
        </div>
        
        {/* Next Prayer Widget (Dynamically Powered by Aladhan.com API) */}
        <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-6 py-4 rounded-2xl gap-4 shadow-sm border border-blue-100 dark:border-blue-800/30">
           <div className="text-right">
             <p className="text-[10px] font-bold text-blue-800/60 dark:text-blue-200/60 uppercase tracking-wider mb-0.5">Next Prayer</p>
             <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{nextPrayer.name} • {nextPrayer.time}</p>
           </div>
           <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-900 dark:text-blue-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </div>
        </div>
      </div>

      {/* 2. Main Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        
        {/* Left Column: Streaks & Zikr */}
        <div className="space-y-6">
          
          {/* Streak Card (Dynamic) */}
          <div className="bg-white dark:bg-black/40 p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm relative overflow-hidden">
            <div className="absolute top-6 right-6 text-primary-100 dark:text-primary-900/30">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13.07 4.8 13.56 2.84C13.65 2.5 13.31 2.19 13.01 2.36C12.19 2.84 11.45 3.48 10.84 4.2C8.75 6.64 8.04 9.94 8.72 13C8.77 13.25 8.44 13.43 8.24 13.26C7.54 12.65 7.04 11.85 6.77 10.96C6.68 10.65 6.22 10.64 6.09 10.93C5.1 13.24 5.37 16.03 6.94 18.06C8.21 19.7 10.02 20.72 12.03 20.93C15.11 21.25 18.23 19.52 19.5 16.66C20.31 14.86 19.56 12.65 17.66 11.2V11.2Z" /></svg>
            </div>
            <div className="inline-block bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">Consistency</div>
            <h3 className="text-2xl font-bold mb-2">{currentStreak} Day Streak</h3>
            
            {currentStreak > 0 ? (
              <p className="text-sm opacity-70 mb-6 w-3/4">MashaAllah, you are building great habits!</p>
            ) : (
              <p className="text-sm opacity-70 mb-6 w-3/4 text-red-600 dark:text-red-400">Complete a task today to start your streak!</p>
            )}

            {/* Progress bar line (Visual logic based on streak) */}
            <div className="h-2 w-full bg-primary-100 dark:bg-primary-900/40 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(currentStreak * 10, 100)}%` }}></div>
            </div>
          </div>

          {/* Big Zikr Card (Dynamic All-Time Tasks) */}
          <div className="bg-primary-900 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
            <h3 className="text-xl font-bold mb-1">Lifetime Tasks</h3>
            <p className="text-primary-200 text-sm mb-10">Total Completions</p>
            <div className="text-center mb-10">
              <span className="text-7xl font-bold font-arabic block mb-6">{completedTasks}</span>
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary-500/50 cursor-pointer hover:bg-primary-400 transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
          </div>

        </div>

        {/* Middle/Right Column: Daily Focus */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm h-full">
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold">Daily Focus</h2>
                <p className="text-sm opacity-70 mt-1">Spiritual and Academic duties for today</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{completedTasksToday}/{totalTasks}</p>
              </div>
            </div>

            {totalTasks === 0 ? (
              <div className="text-center py-12">
                 <div className="text-4xl mb-4">📚</div>
                 <h2 className="text-lg font-bold">No active assignments</h2>
                 <p className="opacity-70 text-sm mb-4">Ask your teacher for a Class Code.</p>
                 <Link href="/student/join" className="bg-primary-100 text-primary-700 px-4 py-2 rounded-xl text-sm font-bold">Join a Class</Link>
              </div>
            ) : (
              <div className="space-y-8">
                {categories.map(category => (
                  <div key={category} className="space-y-4">
                    {/* The sleek Desktop Mockup Category headers RESTORED! */}
                    <h3 className="font-bold text-sm uppercase tracking-wider text-primary-700 dark:text-primary-400 border-b border-black/5 dark:border-white/5 pb-2">
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {groupedAssignments[category].map((assignment: any) => (
                        <AssignmentCard 
                          key={assignment.id} 
                          assignment={assignment} 
                          initialProgress={progressMap[assignment.id]} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 3. Joined Classes Row */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Joined Classes</h2>
          <Link href="/student/join" className="text-sm font-bold text-black/50 dark:text-white/50 hover:text-primary-600 transition-colors">
            View All →
          </Link>
        </div>
        
        {joinedClasses.length === 0 ? (
          <div className="opacity-50 text-sm">You haven't joined any classes yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {joinedClasses.map((c: any) => (
               <div key={c.id} className="bg-white dark:bg-black/40 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
                 <div className="h-24 bg-primary-800 p-4 flex items-end">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase">Enrolled</span>
                 </div>
                 <div className="p-6 flex-grow flex flex-col justify-between">
                   <div>
                     <h3 className="font-bold text-lg mb-1">{c.name}</h3>
                     <p className="text-xs opacity-60">Al-Mu'allim Platform</p>
                   </div>
                   <div className="mt-6 flex justify-between items-center">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white dark:border-black"></div>
                        <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white dark:border-black"></div>
                      </div>
                      <button className="bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-800 transition-colors">
                        Enter Room
                      </button>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>

    </div>
  )
}
