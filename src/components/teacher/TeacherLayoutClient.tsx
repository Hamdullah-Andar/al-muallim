'use client'

import React, { useState } from 'react'
import TopNavbar from '@/components/ui/TopNavbar'
import TeacherSidebar from '@/components/teacher/TeacherSidebar'

interface TeacherLayoutClientProps {
  profileName: string
  children: React.ReactNode
}

export default function TeacherLayoutClient({ profileName, children }: TeacherLayoutClientProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-background">
      {/* PERSISTENT TOP NAVBAR */}
      <TopNavbar
        portalName="Teacher Portal"
        userName={profileName}
        userRole="Teacher"
        onMenuClick={() => setIsMobileOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="w-64 bg-white dark:bg-black border-r border-black/5 dark:border-white/5 hidden md:flex flex-col shadow-sm shrink-0">
          <div className="p-6 border-b border-black/5 dark:border-white/5">
            <h1 className="text-xl font-bold text-primary-800 dark:text-primary-400 font-arabic tracking-wide">
              Al-Mu'allim
            </h1>
            <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest mt-0.5">
              Teacher Portal
            </p>
          </div>
          <TeacherSidebar />
        </aside>

        {/* MOBILE DRAWER OVERLAY & SIDEBAR */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsMobileOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-[280px] max-w-[80vw] bg-white dark:bg-black h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-primary-800 dark:text-primary-400 font-arabic">
                    Al-Mu'allim
                  </h1>
                  <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">
                    Teacher Portal
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-xl text-gray-500 hover:text-black dark:hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <TeacherSidebar onLinkClick={() => setIsMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
