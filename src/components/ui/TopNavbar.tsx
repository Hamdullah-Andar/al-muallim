'use client'

import React from 'react'

interface TopNavbarProps {
  portalName: string
  userName?: string
  userRole?: string
  onMenuClick?: () => void
}

export default function TopNavbar({
  portalName,
  userName = 'User',
  userRole = 'Member',
  onMenuClick,
}: TopNavbarProps) {
  const initial = userName?.charAt(0).toUpperCase() || 'U'

  return (
    <header className="h-16 md:h-20 border-b border-black/5 dark:border-white/5 bg-white/90 dark:bg-black/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 transition-all">
      {/* Left: Mobile Hamburger + Portal Logo / Badge */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors md:hidden"
            title="Open Menu"
            aria-label="Open Navigation Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2.5">
          {/* Geometric Brand Logo Mark */}
          <div className="w-8 h-8 md:w-9 md:h-9 bg-[#bdf3df]/60 dark:bg-emerald-950/60 border border-emerald-300/40 dark:border-emerald-700/50 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-400 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white dark:bg-black rounded-[1px] rotate-45"></div>
            </div>
          </div>
          <span className="text-lg md:text-xl font-bold text-primary-800 dark:text-primary-400 font-arabic tracking-wide">
            Al-Mu'allim
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 hidden sm:inline-block">
            {portalName}
          </span>
        </div>
      </div>

      {/* Right: Notification Bell + User Profile Badge */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Notification Bell */}
        <button
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all relative"
          title="Notifications"
          aria-label="View Notifications"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 pl-2 pr-3 py-1.5 rounded-2xl">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs md:text-sm shadow-sm shrink-0">
            {initial}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs md:text-sm font-bold text-[#092B2B] dark:text-white leading-tight truncate max-w-[120px]">
              {userName}
            </p>
            <p className="text-[10px] font-semibold text-gray-400 capitalize leading-tight">
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
