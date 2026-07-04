'use client'

import { useState } from 'react'
import Link from 'next/link'

type ClassData = {
  id: string
  name: string
  description: string
  teacherId: string
  teacherName: string
  category: string
  imageUrl: string
  progress: number
}

export default function ClassesClient({
  classes,
  userId,
  userName
}: {
  classes: ClassData[]
  userId: string
  userName: string
}) {
  const [filter, setFilter] = useState<'All' | 'In Progress' | 'Completed'>('All')
  const [sortType, setSortType] = useState<'Most Recent' | 'Highest Progress' | 'Lowest Progress'>('Most Recent')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Filter classes based on selected tab
  const filteredClasses = classes.filter(c => {
    if (filter === 'All') return true;
    if (filter === 'In Progress') return c.progress > 0 && c.progress < 100;
    if (filter === 'Completed') return c.progress === 100;
    return true;
  });

  // Sort classes based on selected sort type
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    if (sortType === 'Highest Progress') return b.progress - a.progress;
    if (sortType === 'Lowest Progress') return a.progress - b.progress;
    // Default 'Most Recent' sorting by ID (just for simulation since we don't have created_at)
    return b.id.localeCompare(a.id);
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-sans w-full min-w-0 overflow-x-hidden">
      
      {/* Global Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="hidden md:block w-32"></div> {/* Spacer for left alignment in some layouts, or keep empty */}
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:flex-1 md:justify-end">
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search for lessons..." 
              className="w-full bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 shadow-sm rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#0a6c4c] transition-all"
            />
          </div>

          <div className="flex items-center gap-6 self-end sm:self-auto ml-auto">
            {/* Notification and Settings */}
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
              </button>
              <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800"></div>
            
            {/* Profile */}
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-tight text-gray-900 dark:text-white">{userName}</p>
                  <p className="text-[10px] opacity-60 font-bold mt-0.5">Level 4 Student</p>
               </div>
               <div className="w-9 h-9 rounded-full bg-[#E8F0F8] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-primary-800 font-bold overflow-hidden shadow-sm">
                  {userId ? (
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-500"></div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title & Intro Section */}
      <div className="mb-8">
        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Portal <span className="mx-1">/</span> <span className="text-[#092B2B] dark:text-emerald-500">Joined Classes</span></p>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#092B2B] dark:text-white tracking-tight mb-3">Continue Your Journey</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              You have {classes.length} active classes. Stay consistent with your daily learning goals and keep progressing toward spiritual growth.
            </p>
          </div>
          
          <Link href="/student/join" className="shrink-0">
            <button className="bg-[#092B2B] hover:bg-[#0a3838] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm shadow-emerald-900/20 transition-all flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Join New Class
            </button>
          </Link>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        {/* Toggle Pills */}
        <div className="flex bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 shadow-sm p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
          {['All Classes', 'In Progress', 'Completed'].map(tab => {
            const isActive = filter === (tab === 'All Classes' ? 'All' : tab)
            return (
              <button
                key={tab}
                onClick={() => setFilter((tab === 'All Classes' ? 'All' : tab) as any)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-[#092B2B] dark:bg-emerald-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="relative shrink-0">
           <button 
             onClick={() => setShowSortDropdown(!showSortDropdown)}
             className="flex items-center gap-2 bg-[#F4F7F7] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors"
           >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              Sort: {sortType}
              <svg className={`w-3.5 h-3.5 ml-1 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
           </button>
           
           {showSortDropdown && (
             <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 shadow-xl rounded-xl overflow-hidden z-20">
               {['Most Recent', 'Highest Progress', 'Lowest Progress'].map((option) => (
                 <button
                   key={option}
                   onClick={() => {
                     setSortType(option as any)
                     setShowSortDropdown(false)
                   }}
                   className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors ${
                     sortType === option 
                       ? 'bg-gray-50 dark:bg-gray-800 text-[#092B2B] dark:text-emerald-500' 
                       : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                   }`}
                 >
                   {option}
                 </button>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* Grid of Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full min-w-0">
        
        {sortedClasses.map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1a1a1a] rounded-[28px] overflow-hidden shadow-sm border border-black/5 dark:border-white/5 hover:shadow-md transition-all duration-300 flex flex-col min-w-0 group">
            {/* Card Image Banner */}
            <div className="h-44 w-full relative overflow-hidden bg-gray-100">
               <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
               <div className="absolute top-4 left-4">
                  <span className="bg-[#092B2B]/90 backdrop-blur-sm text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full">
                     {item.category}
                  </span>
               </div>
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="text-xl font-bold text-[#092B2B] dark:text-white tracking-tight line-clamp-1">{item.name}</h3>
                 <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1 shrink-0">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                 </button>
               </div>

               {/* Instructor */}
               <div className="flex items-center gap-2 mb-8">
                 <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.teacherId}`} alt="Teacher" className="w-full h-full object-cover" />
                 </div>
                 <p className="text-xs font-bold text-gray-500 truncate">{item.teacherName}</p>
               </div>
               
               <div className="mt-auto">
                 {/* Progress Info */}
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Course Progress</span>
                   <span className="text-xs font-extrabold text-[#092B2B] dark:text-emerald-400">{item.progress}%</span>
                 </div>
                 
                 {/* Progress Bar */}
                 <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-6 overflow-hidden">
                   <div 
                     className="h-full bg-[#092B2B] dark:bg-emerald-500 rounded-full transition-all duration-1000"
                     style={{ width: `${item.progress}%` }}
                   ></div>
                 </div>

                 {/* Action Button */}
                 <Link href={`/student/class/${item.id}`} className="block w-full">
                   <button className="w-full bg-[#bdf3df] hover:bg-[#a6edd4] dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-[#092B2B] dark:text-emerald-400 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                     Continue Learning
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                   </button>
                 </Link>
               </div>
            </div>
          </div>
        ))}

        {/* Explore New Ghost Card */}
        <div className="bg-transparent border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[28px] overflow-hidden hover:border-[#092B2B]/20 dark:hover:border-emerald-500/20 transition-all duration-300 flex flex-col min-w-0 group cursor-pointer min-h-[380px]">
           <Link href="/student/join" className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFA] dark:bg-[#111] hover:bg-[#F0F4F4] dark:hover:bg-gray-900/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-black border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-[#bdf3df] dark:group-hover:bg-emerald-900/40 text-[#092B2B] dark:text-emerald-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[#092B2B] dark:text-white tracking-tight mb-2">Explore New</h3>
              <p className="text-xs text-gray-500 font-medium max-w-[200px] mx-auto leading-relaxed">
                Browse our catalog of classes and enrich your Islamic knowledge.
              </p>
           </Link>
        </div>

      </div>

    </div>
  )
}
