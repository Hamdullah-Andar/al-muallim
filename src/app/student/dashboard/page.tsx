import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AssignmentCard from '@/components/student/AssignmentCard'
import ZikrTrackerRow from '@/components/ui/ZikrTrackerRow'
import AcademicTaskCard from '@/components/ui/AcademicTaskCard'
import MankiratTracker from '@/components/ui/MankiratTracker'
import DailyPrayersCard from '@/components/ui/DailyPrayersCard'
import { calculateStudentStats } from '@/utils/gamification'
import { getNextPrayer } from '@/utils/prayerTimes'

export const dynamic = 'force-dynamic'

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

  const leftColumnCategories = ['zikr', 'nawafil'] // Prayer removed, handled separately
  const leftAssignments = assignments.filter(a => leftColumnCategories.includes(a.category?.toLowerCase() || ''))
  const rightAssignments = assignments.filter(a => !leftColumnCategories.includes(a.category?.toLowerCase() || '') && a.category?.toLowerCase() !== 'prayer' && a.category?.toLowerCase() !== 'munkarat')

  const prayerAssignment = assignments.find(a => a.category?.toLowerCase() === 'prayer')
  const prayerProgress = prayerAssignment ? progress?.find(p => p.assignment_id === prayerAssignment.id) : null

  const munkaratAssignment = assignments.find(a => a.category?.toLowerCase() === 'munkarat')
  const munkaratProgress = munkaratAssignment ? progress?.find(p => p.assignment_id === munkaratAssignment.id) : null

  // Calculate high-level progress stats for TODAY
  const totalTasks = assignments.length
  const completedTasksToday = progress?.filter(p => p.is_completed).length || 0
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasksToday / totalTasks) * 100)

  // Fetch ALL-TIME Gamification Stats & Live Prayer Times
  const { currentStreak, completedTasks } = await calculateStudentStats(supabase, user.id);
  const nextPrayer = await getNextPrayer();

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 animate-in fade-in duration-500 font-sans">
      
      {/* 1. Header Row (Greeting + Profile) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Assalamu Alaikum, {profile?.full_name?.split(' ')[0] || 'Student'}</h1>
          <p className="opacity-70 text-sm">May your day be filled with barakah and focus.</p>
        </div>
        
        {/* Right side Profile controls */}
        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-gray-900 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </button>
          <button className="text-gray-400 hover:text-gray-900 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-tight">{profile?.full_name}</p>
                <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Student</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold overflow-hidden shadow-sm">
                {/* Dicebear generates beautiful geometric avatars for us! */}
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} alt="avatar" />
             </div>
          </div>
        </div>
      </div>

      {/* 2. Top Stats Row (Streak & Overall Completion) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Streak Card */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between border-l-8 border-l-[#0a6c4c]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#bdf3df] flex items-center justify-center text-primary-800">
               <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13.07 4.8 13.56 2.84C13.65 2.5 13.31 2.19 13.01 2.36C12.19 2.84 11.45 3.48 10.84 4.2C8.75 6.64 8.04 9.94 8.72 13C8.77 13.25 8.44 13.43 8.24 13.26C7.54 12.65 7.04 11.85 6.77 10.96C6.68 10.65 6.22 10.64 6.09 10.93C5.1 13.24 5.37 16.03 6.94 18.06C8.21 19.7 10.02 20.72 12.03 20.93C15.11 21.25 18.23 19.52 19.5 16.66C20.31 14.86 19.56 12.65 17.66 11.2V11.2Z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Daily Streak</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{currentStreak} Days</h3>
            </div>
          </div>
          {completedTasksToday > 0 && (
            <div className="text-sm font-bold text-primary-800">+{completedTasksToday} today</div>
          )}
        </div>

        {/* Overall Completion Card */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-between border-l-8 border-l-[#0a6c4c]">
           <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
               <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
             </div>
             <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Overall Completion</p>
               <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{completionPercentage}%</h3>
             </div>
           </div>
           
           {/* Custom Pill Progress Bar matching the screenshot */}
           <div className="w-32 sm:w-48 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#0a6c4c] rounded-full transition-all duration-1000 ease-out" 
               style={{ width: `${completionPercentage}%` }}
             ></div>
           </div>
        </div>
      </div>

      {/* 2.5 Daily Prayers Full Width Card */}
      {prayerAssignment && (
         <DailyPrayersCard 
           assignment={prayerAssignment} 
           initialProgress={prayerProgress} 
           nextPrayer={nextPrayer} 
         />
      )}

      {/* 3. The Two Columns (Spiritual Rituals vs Academic) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        {/* LEFT COLUMN: Spiritual Rituals (Zikr, Prayers, Nawafil) */}
        <div className="space-y-6">
           <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Zikr Tracking</h2>
             <span className="text-xs font-bold text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
           </div>
           
           {leftAssignments.length === 0 ? (
             <div className="bg-white dark:bg-black/40 p-8 rounded-3xl text-center border border-dashed border-black/10 dark:border-white/10">
               <p className="text-gray-500 text-sm">No spiritual tracking assigned for today.</p>
             </div>
           ) : (
             <div className="space-y-4">
                {leftAssignments.map(assignment => {
                   if (assignment.category?.toLowerCase() === 'zikr') {
                     return <ZikrTrackerRow key={assignment.id} assignment={assignment} initialProgress={progressMap[assignment.id]} />
                   }
                   return <AcademicTaskCard key={assignment.id} assignment={assignment} initialProgress={progressMap[assignment.id]} />
                })}
             </div>
           )}
        </div>

        {/* RIGHT COLUMN: Academic To-Do List (Tilawat, Hadith, Tarjoma, etc) */}
        <div className="space-y-6">
           <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Academic To-Do List</h2>
             <span className="text-xs font-bold text-primary-600 cursor-pointer">View All</span>
           </div>
           
           {rightAssignments.length === 0 && !munkaratAssignment ? (
             <div className="bg-white dark:bg-black/40 p-8 rounded-3xl text-center border border-dashed border-black/10 dark:border-white/10">
               <p className="text-gray-500 text-sm">No academic tasks assigned for today.</p>
             </div>
           ) : (
             <div className="space-y-4">
                {/* Your Custom Mankirat Tracker! */}
                {munkaratAssignment && (
                   <MankiratTracker 
                     assignment={munkaratAssignment} 
                     initialProgress={munkaratProgress} 
                   />
                )}

                {rightAssignments.map(assignment => (
                   <AcademicTaskCard key={assignment.id} assignment={assignment} initialProgress={progressMap[assignment.id]} />
                ))}
             </div>
           )}
        </div>

      </div>
      
      {/* 4. Joined Classes Redesign */}
      <div>
         <div className="flex justify-between items-end mb-6">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">Joined Classes</h2>
         </div>
         
         {joinedClasses.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/student/join" className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[24px] p-8 flex flex-col items-center justify-center text-gray-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/50 transition-all h-[320px]">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Browse More Classes</h3>
              </Link>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {joinedClasses.map((c: any, index: number) => {
                 // Alternate images for the aesthetic
                 const imageUrl = index % 2 === 0 
                   ? "https://images.unsplash.com/photo-1609599006353-e629aaab31ce?auto=format&fit=crop&q=80&w=800" // Quran/Islamic geometric
                   : "https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&q=80&w=800" // Architecture/Mosque
                   
                 return (
                   <div key={c.id} className="bg-white dark:bg-black/40 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-all h-[320px]">
                     {/* Top Image Half */}
                     <div className="h-40 relative overflow-hidden bg-gray-100">
                        <img src={imageUrl} alt="Class cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                           <span className="bg-[#bdf3df] text-[#0a6c4c] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Intermediate</span>
                        </div>
                     </div>
                     
                     {/* Bottom Details Half */}
                     <div className="p-6 flex-grow flex flex-col justify-between">
                       <div>
                         <h3 className="font-bold text-lg mb-1 group-hover:text-primary-600 transition-colors">{c.name}</h3>
                         <p className="text-xs text-gray-500 line-clamp-2">Deep dive into the linguistics and context of the Surah.</p>
                       </div>
                       
                       <div className="mt-4 flex justify-between items-center">
                          <div className="flex -space-x-2">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${c.id}1`} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white dark:border-black" alt="Student" />
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${c.id}2`} className="w-8 h-8 rounded-full bg-green-100 border-2 border-white dark:border-black" alt="Student" />
                            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white dark:border-black flex items-center justify-center text-[8px] font-bold text-gray-500">+14</div>
                          </div>
                          <button className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors flex items-center gap-1">
                            Enter Class <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                          </button>
                       </div>
                     </div>
                   </div>
                 )
               })}

               {/* Browse More Card */}
               <Link href="/student/join" className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[24px] p-8 flex flex-col items-center justify-center text-gray-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/50 transition-all h-[320px]">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 dark:bg-blue-900/30 flex items-center justify-center mb-4 border border-blue-100">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Browse More Classes</h3>
               </Link>
            </div>
         )}
      </div>

    </div>
  )
}
