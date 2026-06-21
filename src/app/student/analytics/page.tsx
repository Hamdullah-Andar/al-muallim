import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function StudentAnalytics() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // In Phase 5, we are focusing on the precise UI implementation of the design.
  // These dynamic metrics will be fully wired up to real calculation algorithms in Phase 6.

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 bg-transparent min-h-screen">
      
      {/* Header section matching design */}
      <div className="flex justify-between items-center mb-8">
         <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">My Progress</h1>
            <div className="bg-[#bdf3df] text-[#0a6c4c] dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
               <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
               On track for weekly goals
            </div>
         </div>
         
         <button className="flex items-center gap-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl shadow-sm text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Last 30 Days
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
         </button>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
         
         <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center flex-shrink-0">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13.07 4.8 13.56 2.84C13.65 2.5 13.31 2.19 13.01 2.36C12.19 2.84 11.45 3.48 10.84 4.2C8.75 6.64 8.04 9.94 8.72 13C8.77 13.25 8.44 13.43 8.24 13.26C7.54 12.65 7.04 11.85 6.77 10.96C6.68 10.65 6.22 10.64 6.09 10.93C5.1 13.24 5.37 16.03 6.94 18.06C8.21 19.7 10.02 20.72 12.03 20.93C15.11 21.25 18.23 19.52 19.5 16.66C20.31 14.86 19.56 12.65 17.66 11.2V11.2Z" /></svg>
            </div>
            <div>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Current Streak</p>
               <p className="text-xl font-bold text-gray-900 dark:text-white">12 Days</p>
            </div>
         </div>

         <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500 flex items-center justify-center flex-shrink-0">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </div>
            <div>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Knowledge Points</p>
               <p className="text-xl font-bold text-gray-900 dark:text-white">2,450</p>
            </div>
         </div>

         <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center flex-shrink-0">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.14 2 5 5.14 5 9C5 11.23 6.06 13.23 7.74 14.53L6 22L12 19.5L18 22L16.26 14.53C17.94 13.23 19 11.23 19 9C19 5.14 15.86 2 12 2ZM12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12Z" /></svg>
            </div>
            <div>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Mastery Badges</p>
               <p className="text-xl font-bold text-gray-900 dark:text-white">18</p>
            </div>
         </div>

         <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-[3px] border-[#0a6c4c] dark:border-emerald-500 flex items-center justify-center flex-shrink-0 relative">
               <span className="text-xs font-bold text-[#0a6c4c] dark:text-emerald-400">82%</span>
            </div>
            <div>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Overall Mastery</p>
               <p className="text-xl font-bold text-gray-900 dark:text-white">Year 1 Level</p>
            </div>
         </div>
      </div>

      {/* Middle Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         
         {/* Left: Completion Trends Chart */}
         <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800/60 flex flex-col">
            <div className="flex justify-between items-center mb-10">
               <h3 className="font-bold text-gray-900 dark:text-white">Completion Trends</h3>
               <div className="flex gap-4 text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#0a6c4c] dark:bg-emerald-500"></div> Daily Units</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#bdf3df] dark:bg-emerald-900"></div> Avg Goal</div>
               </div>
            </div>
            
            {/* The Custom Tailwind Bar Chart */}
            <div className="flex-grow flex items-end justify-between px-2 gap-2 relative min-h-[200px]">
               {/* Grid lines */}
               <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none pb-6">
                 <div className="w-full h-px bg-black dark:bg-white"></div>
                 <div className="w-full h-px bg-black dark:bg-white"></div>
                 <div className="w-full h-px bg-black dark:bg-white"></div>
                 <div className="w-full h-px bg-black dark:bg-white"></div>
               </div>
               
               {/* Render Bars */}
               {['MON','TUE','WED','THU','FRI','SAT','SUN','MON','TUE'].map((day, i) => {
                 const h1 = Math.floor(Math.random() * 60) + 30; // Random heights for mockup design
                 const h2 = Math.floor(Math.random() * 40) + 40; 
                 return (
                   <div key={i} className="flex flex-col items-center flex-1 group z-10 h-full">
                     <div className="w-full flex justify-center items-end gap-1 mb-4 h-full">
                       <div className="w-1/3 bg-[#0a6c4c] dark:bg-emerald-500 rounded-t-sm transition-all hover:opacity-80" style={{height: `${h1}%`}}></div>
                       <div className="w-1/3 bg-[#bdf3df] dark:bg-emerald-900 rounded-t-sm transition-all hover:opacity-80" style={{height: `${h2}%`}}></div>
                     </div>
                     <span className="text-[9px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white tracking-wider">{day}</span>
                   </div>
                 )
               })}
            </div>
         </div>

         {/* Right: Discipline Checklist */}
         <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800/60">
            <h3 className="font-bold text-gray-900 dark:text-white mb-8">Discipline Checklist</h3>
            
            <div className="space-y-6">
               {[
                 { name: 'Daily Prayers', score: 88, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                 { name: 'Zikr', score: 62, icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
                 { name: 'Quran Reading', score: 94, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                 { name: 'Sport', score: 50, icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
                 { name: 'Assignments', score: 75, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
               ].map(item => (
                 <div key={item.name}>
                   <div className="flex justify-between text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                     <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#0a6c4c] dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                        {item.name}
                     </span>
                     <span className="text-[#0a6c4c] dark:text-emerald-400">{item.score}%</span>
                   </div>
                   <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                     <div className="bg-[#0a6c4c] dark:bg-emerald-500 h-1.5 rounded-full" style={{ width: `${item.score}%` }}></div>
                   </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Bottom Milestones Row */}
      <div>
         <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">Recent Milestones</h3>
            <Link href="#" className="text-sm font-bold text-[#0a6c4c] dark:text-emerald-500 hover:underline">View Achievement Hall</Link>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border-l-4 border-l-[#bdf3df] border-y border-r border-gray-100 dark:border-gray-800/60 flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-[#bdf3df] dark:bg-emerald-900/30 text-[#0a6c4c] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">30 Juz Completed</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-3 pr-2">Full Quran recitation completed during Ramadan cycle.</p>
                  <p className="text-[10px] font-bold text-gray-400">Earned 2 days ago</p>
               </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border-l-4 border-l-yellow-400 border-y border-r border-gray-100 dark:border-gray-800/60 flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">99 Names Memorized</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-3 pr-2">Successfully tested on the Asma-ul-Husna with 100% accuracy.</p>
                  <p className="text-[10px] font-bold text-gray-400">Earned 1 week ago</p>
               </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border-l-4 border-l-[#0a6c4c] border-y border-r border-gray-100 dark:border-gray-800/60 flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-[#bdf3df] dark:bg-emerald-900/30 text-[#0a6c4c] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Consistent Calligrapher</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-3 pr-2">Completed 20 hours of Arabic script practice this month.</p>
                  <p className="text-[10px] font-bold text-gray-400">Earned 3 weeks ago</p>
               </div>
            </div>

         </div>
      </div>

    </div>
  )
}
