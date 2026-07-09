'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { logZikrSession, togglePrayer } from '@/app/student/class/[id]/actions'

// Helper to determine if a prayer time has arrived (simplified logic)
const isPrayerTimeAllowed = (prayerName: string) => {
  const currentHour = new Date().getHours()
  switch (prayerName) {
    case 'Fajr': return currentHour >= 4 // After 4 AM
    case 'Dhuhr': return currentHour >= 12 // After 12 PM
    case 'Asr': return currentHour >= 15 // After 3 PM
    case 'Maghrib': return currentHour >= 17 // After 5 PM
    case 'Isha': return currentHour >= 19 // After 7 PM
    default: return true
  }
}

export default function ClassDetailClient({ 
  classData, 
  initialAssignments, 
  initialProgress,
  progressPercentage,
  studentId
}: { 
  classData: any,
  initialAssignments: any[],
  initialProgress: any[],
  progressPercentage: number,
  studentId: string
}) {
  const [isPending, startTransition] = useTransition()
  
  // State for optimistic UI
  const [progressState, setProgressState] = useState(initialProgress)

  // Zikr Modal State
  const [isZikrModalOpen, setIsZikrModalOpen] = useState(false)
  const [selectedZikrId, setSelectedZikrId] = useState('')
  const [zikrCount, setZikrCount] = useState<number | ''>('')
  const [zikrDate, setZikrDate] = useState(new Date().toISOString().slice(0, 16))

  // Find Prayer Assignment
  const prayerAssignment = initialAssignments.find(a => a.category === 'Prayer')
  
  // Get today's progress for prayer
  const todayDateStr = new Date().toISOString().split('T')[0]
  const todayPrayerProgress = progressState.find(p => p.assignment_id === prayerAssignment?.id && p.tracking_date === todayDateStr)
  
  // Hydrate prayer data from bitmask if progress_data is empty
  let prayerData = todayPrayerProgress?.progress_data || {}
  if (Object.keys(prayerData).length === 0 && todayPrayerProgress?.completed_value) {
    const m = todayPrayerProgress.completed_value;
    prayerData = {
      Fajr: (m & 1) !== 0,
      Dhuhr: (m & 2) !== 0,
      Asr: (m & 4) !== 0,
      Maghrib: (m & 8) !== 0,
      Isha: (m & 16) !== 0
    }
  }

  // Zikr Assignments
  const zikrAssignments = initialAssignments.filter(a => a.category === 'Zikr')

  // Calculate aggregates
  const totalPrayersTracked = progressState
    .filter(p => initialAssignments.find(a => a.id === p.assignment_id)?.category === 'Prayer')
    .reduce((sum, p) => {
      // Calculate how many prayers are true in the bitmask
      const m = p.completed_value || 0;
      let count = 0;
      if (m & 1) count++;
      if (m & 2) count++;
      if (m & 4) count++;
      if (m & 8) count++;
      if (m & 16) count++;
      return sum + count;
    }, 0)
  
  const totalZikrsCompleted = progressState
    .filter(p => initialAssignments.find(a => a.id === p.assignment_id)?.category === 'Zikr' && p.is_completed)
    .length

  const handlePrayerToggle = (prayerName: string) => {
    if (!prayerAssignment) return
    if (!isPrayerTimeAllowed(prayerName)) {
      alert(`It is not time for ${prayerName} yet.`)
      return
    }

    const isChecked = !prayerData[prayerName]
    
    // ========================================================================
    // OPTIMISTIC UI UPDATE
    // We instantly update the UI using React's startTransition so the user
    // doesn't feel any lag while the database syncs in the background.
    // We use async/await here to ensure Next.js keeps the transition active
    // until the Server Action and revalidatePath finish, preventing loading.tsx flash.
    // ========================================================================
    startTransition(async () => {
      const newData = { ...prayerData, [prayerName]: isChecked }
      
      // Calculate optimistic bitmask for the client state
      // This matches the Dashboard's bitmask logic perfectly
      let mask = 0;
      if (newData['Fajr']) mask |= 1;
      if (newData['Dhuhr']) mask |= 2;
      if (newData['Asr']) mask |= 4;
      if (newData['Maghrib']) mask |= 8;
      if (newData['Isha']) mask |= 16;
      
      setProgressState(prev => {
        const exists = prev.find(p => p.assignment_id === prayerAssignment.id && p.tracking_date === todayDateStr)
        if (exists) {
          return prev.map(p => p.id === exists.id ? { ...p, progress_data: newData, completed_value: mask } : p)
        }
        return [...prev, { assignment_id: prayerAssignment.id, tracking_date: todayDateStr, progress_data: newData, completed_value: mask }]
      })

      // Await the server action so the transition covers the revalidatePath network request
      await togglePrayer(studentId, prayerAssignment.id, prayerName, isChecked, todayDateStr, classData.id)
    })
  }

  const handleLogZikr = () => {
    if (!selectedZikrId || !zikrCount) return
    
    const count = Number(zikrCount)
    const dateStr = zikrDate.split('T')[0]

    // Optimistic Update
    startTransition(async () => {
      setProgressState(prev => {
        const exists = prev.find(p => p.assignment_id === selectedZikrId && p.tracking_date === dateStr)
        if (exists) {
          return prev.map(p => p.id === exists.id ? { ...p, completed_value: (p.completed_value || 0) + count } : p)
        }
        return [...prev, { assignment_id: selectedZikrId, tracking_date: dateStr, completed_value: count }]
      })

      // Await the server action
      await logZikrSession(studentId, selectedZikrId, count, dateStr, classData.id)
    })

    setIsZikrModalOpen(false)
    setZikrCount('')
  }

  // Bonus Zikr Message Logic
  const selectedZikrAssignment = zikrAssignments.find(a => a.id === selectedZikrId)
  const zikrTarget = selectedZikrAssignment?.content?.target || 0
  const currentCountForSelectedDate = progressState.find(p => p.assignment_id === selectedZikrId && p.tracking_date === zikrDate.split('T')[0])?.completed_value || 0
  const proposedTotal = currentCountForSelectedDate + Number(zikrCount || 0)
  const isBonus = proposedTotal > zikrTarget && zikrTarget > 0
  const bonusAmount = proposedTotal - zikrTarget

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* TOP HEADER BAR */}
      <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white dark:bg-[#0a0a0a] border-b border-black/5 dark:border-white/5 sticky top-0 z-10">
        <div className="flex-1 max-w-2xl relative">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search courses, lessons, or resources..." 
            className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-6 ml-8">
          <button className="relative text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0a]"></span>
          </button>
          <button className="text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          
          <div className="h-8 w-px bg-black/10 dark:bg-white/10 mx-2"></div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold leading-none">Student</p>
              <p className="text-xs opacity-60 mt-1">Advanced Student</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="p-8 max-w-[1200px] w-full mx-auto relative">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-semibold mb-6">
          <Link href="/student/classes" className="opacity-60 hover:opacity-100 transition-opacity">My Courses</Link>
          <span className="opacity-40">›</span>
          <span>{classData.name}</span>
        </div>

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-arabic text-[#092B2B] dark:text-white mb-2">{classData.name}</h1>
          <p className="opacity-70 font-medium">
            {classData.teacher?.full_name || 'Teacher'} • {classData.description || 'Course'}
          </p>
        </div>

        {/* Banner */}
        <div className="relative w-full h-[280px] rounded-[32px] overflow-hidden mb-10 shadow-xl group">
          <img 
            src="https://images.unsplash.com/photo-1608338781423-f3ec87570997?q=80&w=2000" 
            alt="Quran" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#092B2B]/95 via-[#092B2B]/80 to-transparent"></div>
          
          <div className="absolute inset-0 p-10 flex flex-col justify-center text-white">
            <div className="inline-block bg-[#bdf3df] text-[#092B2B] px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4 w-fit">
              CURRENT MODULE: MAKHAARIJ
            </div>
            <h2 className="text-4xl font-bold font-arabic mb-3">Mastering Articulation</h2>
            <p className="text-white/80 max-w-md text-lg mb-8 leading-relaxed font-medium">
              Deep dive into the points of articulation for every Arabic letter with guided practice.
            </p>
            <button className="bg-white text-[#092B2B] hover:bg-gray-50 px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-3 w-fit">
              Continue Learning
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
          </div>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          
          {/* Left Column */}
          <div className="space-y-8">
            
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Course Journey Card */}
              <div className="bg-white dark:bg-[#111] rounded-[32px] p-8 shadow-sm border border-black/5 dark:border-white/5">
                <div className="flex justify-between items-end mb-6">
                  <h3 className="text-xl font-bold text-[#092B2B] dark:text-white leading-tight">Course<br/>Journey</h3>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#092B2B] dark:text-white">{progressPercentage}%</span>
                    <span className="block text-xs font-bold opacity-60">Complete</span>
                  </div>
                </div>
                
                <div className="w-full bg-[#f0f9f5] dark:bg-white/5 rounded-full h-3 mb-8 overflow-hidden">
                  <div className="bg-[#092B2B] dark:bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-[#f8fbfd] dark:bg-white/5 rounded-2xl p-4 flex-1 flex items-center gap-3">
                    <div className="w-8 h-8 flex-shrink-0 text-[#092B2B] dark:text-emerald-400">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-wider opacity-50 mb-0.5">PRAYERS</p>
                      <p className="text-sm font-bold">{totalPrayersTracked}</p>
                    </div>
                  </div>
                  <div className="bg-[#f8fbfd] dark:bg-white/5 rounded-2xl p-4 flex-1 flex items-center gap-3">
                    <div className="w-8 h-8 flex-shrink-0 text-[#092B2B] dark:text-emerald-400">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6-6.2-4.6-6.2 4.6 2.4-7.6L2 9.6h7.6L12 2z"/></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-wider opacity-50 mb-0.5">ZIKR</p>
                      <p className="text-sm font-bold">{totalZikrsCompleted}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Reading Card */}
              <div className="bg-white dark:bg-[#111] rounded-[32px] p-8 shadow-sm border border-black/5 dark:border-white/5 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#bdf3df]/40 flex items-center justify-center text-[#092B2B]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <span className="text-[11px] font-black tracking-widest text-[#092B2B] dark:text-emerald-400 uppercase">CURRENT READING</span>
                </div>
                
                <h4 className="text-lg font-bold mb-1 text-[#092B2B] dark:text-white">Tuhfat al-Atfal</h4>
                <p className="text-sm opacity-70 mb-auto leading-relaxed">Rules of Noon Sakina • Pages 24 - 38</p>

                <button className="w-full mt-8 bg-[#bdf3df] hover:bg-[#a6eed3] text-[#092B2B] font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                  Open Digital Book
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </button>
              </div>

            </div>

            {/* Bottom Trackers Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Daily Prayer Tracker */}
              <div className="bg-white dark:bg-[#111] rounded-[32px] p-8 shadow-sm border border-black/5 dark:border-white/5 relative">
                {isPending && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 rounded-[32px]"></div>}
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#092B2B] dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <h3 className="text-xl font-bold text-[#092B2B] dark:text-white leading-tight">Daily<br/>Prayer</h3>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] font-bold opacity-60">Today,</span>
                    <span className="block text-xs font-black">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayerName) => {
                    const completed = !!prayerData[prayerName]
                    const allowed = isPrayerTimeAllowed(prayerName)
                    
                    return (
                      <button 
                        key={prayerName} 
                        onClick={() => handlePrayerToggle(prayerName)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                          completed 
                            ? 'bg-[#f0f9f5] border-[#bdf3df]/50 dark:bg-emerald-900/10 dark:border-emerald-500/20' 
                            : allowed 
                              ? 'bg-[#fbfbfb] border-transparent hover:border-black/5 dark:bg-white/5 dark:hover:border-white/10'
                              : 'bg-gray-50 border-transparent opacity-50 cursor-not-allowed dark:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${completed ? 'text-[#092B2B] dark:text-emerald-400' : 'opacity-70'}`}>{prayerName}</span>
                          {!allowed && <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>}
                        </div>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          completed 
                            ? 'bg-[#092B2B] border-[#092B2B] dark:bg-emerald-500 dark:border-emerald-500 text-white' 
                            : 'border-black/20 dark:border-white/20'
                        }`}>
                          {completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Assigned Zikr */}
              <div className="bg-white dark:bg-[#111] rounded-[32px] p-8 shadow-sm border border-black/5 dark:border-white/5">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#092B2B] dark:text-white leading-tight">Assigned<br/>Zikr</h3>
                  </div>
                  <button className="text-xs font-bold opacity-50 hover:opacity-100 transition-opacity">View<br/>All</button>
                </div>

                <div className="space-y-6">
                  {zikrAssignments.length === 0 ? (
                    <p className="text-sm opacity-50 text-center py-4">No Zikr assigned for this class.</p>
                  ) : zikrAssignments.map((zikr, i) => {
                    const target = zikr.content?.target || 0
                    const pRecord = progressState.find(p => p.assignment_id === zikr.id && p.tracking_date === todayDateStr)
                    const completed = pRecord?.completed_value || 0
                    
                    // Cap percentage at 100 for UI purposes
                    const pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0

                    return (
                      <div key={zikr.id}>
                        <div className="flex justify-between items-end mb-2">
                          <span className="font-bold text-sm truncate pr-2" title={zikr.title}>{zikr.title} <span className="opacity-50 text-xs font-normal">({target}x)</span></span>
                          <div className="flex items-center gap-2 shrink-0">
                            {completed > target && (
                              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                +{completed - target} Bonus
                              </span>
                            )}
                            <span className="text-[10px] font-black tracking-wider">
                              <span className={pct === 100 ? 'text-[#092B2B] dark:text-emerald-400' : 'opacity-50'}>{completed > target ? target : completed}</span> / {target}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-[#fbfbfb] dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-[#092B2B] dark:bg-emerald-500' : 'bg-[#092B2B]/60 dark:bg-emerald-400/60'}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {zikrAssignments.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setIsZikrModalOpen(true)}
                    className="w-full mt-8 border-2 border-dashed border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 hover:bg-black/5 dark:hover:bg-white/5 py-3 rounded-2xl text-xs font-bold opacity-60 hover:opacity-100 transition-all flex justify-center items-center gap-2"
                  >
                    <span>+</span> Log New Session
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ZIKR MODAL */}
        {isZikrModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#111] rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setIsZikrModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="flex items-center gap-3 mb-8">
                <svg className="w-6 h-6 text-[#092B2B] dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <h2 className="text-2xl font-bold text-[#092B2B] dark:text-white">Log Zikr Session</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold opacity-70 mb-2">Zikr Type</label>
                  <div className="relative">
                    <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <select 
                      value={selectedZikrId}
                      onChange={(e) => setSelectedZikrId(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-black/10 rounded-xl py-3 pl-11 pr-4 text-sm font-medium appearance-none"
                    >
                      <option value="" disabled>Select Zikr...</option>
                      {zikrAssignments.map(z => (
                        <option key={z.id} value={z.id}>{z.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold opacity-70 mb-2">Total Count</label>
                    <div className="relative">
                      <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                      <input 
                        type="number" 
                        value={zikrCount}
                        onChange={(e) => setZikrCount(Number(e.target.value))}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-black/10 rounded-xl py-3 pl-11 pr-4 text-sm font-medium"
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold opacity-70 mb-2">Date & Time</label>
                    <div className="relative">
                      <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <input 
                        type="datetime-local" 
                        value={zikrDate}
                        onChange={(e) => setZikrDate(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-black/10 rounded-xl py-3 pl-11 pr-4 text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                {isBonus && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex gap-3 animate-in slide-in-from-top-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <p className="text-xs leading-relaxed font-medium">
                      MashAllah! You are exceeding your daily goal by {bonusAmount}. The extra count will be recorded as bonus Zikr.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold opacity-70 mb-2">Notes (Optional)</label>
                  <textarea 
                    className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-black/10 rounded-xl p-4 text-sm font-medium resize-none h-24"
                    placeholder="How did you feel during this session?"
                  />
                </div>

                {!isBonus && (
                  <div className="bg-[#f0f9f5] dark:bg-emerald-900/10 text-[#092B2B] dark:text-emerald-400 p-4 rounded-xl flex gap-3">
                    <svg className="w-5 h-5 opacity-60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs leading-relaxed font-medium opacity-80">
                      Logging regular Zikr helps in maintaining spiritual mindfulness (Tazkiyah).
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsZikrModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleLogZikr}
                  disabled={!selectedZikrId || !zikrCount || isPending}
                  className="flex-1 bg-[#092B2B] dark:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Logging...' : 'Log Session'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
