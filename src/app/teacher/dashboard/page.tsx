import { createClient } from '@/utils/supabase/server'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] || 'Teacher'

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 font-arabic tracking-tight text-foreground">As-salamu alaykum, {firstName}</h1>
          <p className="text-lg opacity-70">Your students have completed 0 tasks this morning. Ready to start a new lesson?</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap">
          + Create New Class
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Students */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 opacity-70">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <p className="text-xs font-bold uppercase tracking-wider">Total Students</p>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold">0</h3>
            <span className="text-sm text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md">+0 this month</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 opacity-70">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-xs font-bold uppercase tracking-wider">Completion Rate</p>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold">0%</h3>
          </div>
          <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-primary-600 h-full w-0 rounded-full"></div>
          </div>
        </div>

        {/* Active Classes */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 opacity-70">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-xs font-bold uppercase tracking-wider">Active Classes</p>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold">0</h3>
            <span className="text-sm opacity-60 font-medium">0 New this week</span>
          </div>
        </div>

      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-4">
        
        {/* Left Column (Active Classes & Heatmap) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Active Classes Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Active Classes</h2>
              <button className="text-sm text-primary-600 dark:text-primary-400 font-bold hover:underline">View All</button>
            </div>
            
            {/* Empty State */}
            <div className="bg-white dark:bg-black/40 p-12 rounded-xl border border-dashed border-black/20 dark:border-white/20 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">No Active Classes</h3>
              <p className="opacity-70 max-w-sm mb-8">You haven't created any classes yet. Create your first class to invite students and assign tasks.</p>
              <button className="bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:hover:bg-primary-800 text-primary-800 dark:text-primary-200 px-6 py-3 rounded-lg font-bold transition-colors">
                Create First Class
              </button>
            </div>
          </div>

          {/* Student Progress Heatmap */}
          <div className="bg-primary-900 text-white p-8 rounded-xl shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-2">Student Progress Heatmap</h2>
              <p className="opacity-80 mb-8 max-w-md">Activity is 12% higher this week compared to last month. Keep up the great momentum!</p>
              
              {/* Fake Graph Bars */}
              <div className="flex items-end gap-3 h-32 opacity-80">
                <div className="w-full bg-white/20 h-1/3 rounded-t-sm hover:bg-white/40 transition-colors cursor-pointer"></div>
                <div className="w-full bg-white/40 h-2/3 rounded-t-sm hover:bg-white/60 transition-colors cursor-pointer"></div>
                <div className="w-full bg-white/60 h-full rounded-t-sm hover:bg-white/80 transition-colors cursor-pointer"></div>
                <div className="w-full bg-white/30 h-1/2 rounded-t-sm hover:bg-white/50 transition-colors cursor-pointer"></div>
                <div className="w-full bg-white/80 h-5/6 rounded-t-sm hover:bg-white transition-colors cursor-pointer"></div>
                <div className="w-full bg-white/50 h-2/3 rounded-t-sm hover:bg-white/70 transition-colors cursor-pointer"></div>
                <div className="w-full bg-white/90 h-full rounded-t-sm hover:bg-white transition-colors cursor-pointer"></div>
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          </div>

        </div>

        {/* Right Column (Upcoming) */}
        <div className="space-y-8">
           <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Upcoming Classes</h2>
            
            <div className="flex flex-col items-center justify-center py-8 text-center">
               <svg className="w-12 h-12 text-black/20 dark:text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="opacity-60 text-sm font-medium">No upcoming classes scheduled.</p>
            </div>
            
            <button className="w-full mt-4 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 py-2 rounded-lg text-sm font-bold transition-colors">
              View Calendar
            </button>
          </div>

          <div className="bg-white dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Recent Activity</h2>
            
            <div className="flex flex-col items-center justify-center py-8 text-center">
               <svg className="w-12 h-12 text-black/20 dark:text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="opacity-60 text-sm font-medium">No recent activity.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
