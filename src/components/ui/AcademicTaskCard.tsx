'use client'

import { useState } from 'react'
import { toggleAssignmentProgress } from '@/app/student/dashboard/actions'
import Link from 'next/link'

interface AcademicTaskCardProps {
  assignment: any;
  initialProgress: any;
}

export default function AcademicTaskCard({ assignment, initialProgress }: AcademicTaskCardProps) {
  const [isCompleted, setIsCompleted] = useState(initialProgress?.is_completed || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const target = assignment.content?.target || assignment.target_count || 0
  const unit = assignment.content?.unit || assignment.unit || (assignment.category === 'Reading' ? 'Ayat' : 'Times')
  const completedValue = initialProgress?.completed_value || 0
  const titleLower = (assignment.title || '').toLowerCase()
  const isReading = assignment.category === 'Reading' || assignment.content?.linkedBookId || assignment.linked_book_id || titleLower.includes('quran') || titleLower.includes('recit') || titleLower.includes('reading')

  const getReadingLink = () => {
    const linked = assignment.content?.linkedBookId || assignment.linked_book_id
    const param = `?assignmentId=${assignment.id}`
    if (linked === 'quran' || titleLower.includes('quran') || titleLower.includes('recit') || titleLower.includes('surah') || titleLower.includes('juz') || titleLower.includes('ayah')) {
      return `/student/library/quran${param}`
    }
    if (linked && linked !== 'quran') {
      return `/student/library/${linked}${param}`
    }
    if (titleLower.includes('tafsir') || titleLower.includes('anwar')) return `/student/library/7${param}`
    if (titleLower.includes('hadith') || titleLower.includes('riyad')) return `/student/library/9${param}`
    if (titleLower.includes('fiqh')) return `/student/library/cont-fiqh${param}`
    if (titleLower.includes('history') || titleLower.includes('caliph')) return `/student/library/cont-history${param}`
    return `/student/library/quran${param}`
  }

  const handleMarkDone = async () => {
    if (isCompleted || isSubmitting) return
    setIsSubmitting(true)

    // Optimistic UI
    setIsCompleted(true)

    try {
      await toggleAssignmentProgress(assignment.id, true, null)
    } catch (e) {
      console.error(e)
      setIsCompleted(false)
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className={`bg-white dark:bg-black/40 rounded-2xl border ${isCompleted ? 'border-primary-500/30' : 'border-black/5 dark:border-white/5'} shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md relative overflow-hidden`}>
      
      {/* Optional Success Background Overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/10 pointer-events-none"></div>
      )}

      {/* Left Side: Title and Priority / Progress */}
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-3 mb-1.5">
          <h3 className={`font-bold ${isCompleted ? 'text-primary-800 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
            {assignment.title}
          </h3>
          {target > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 shrink-0">
              {completedValue}/{target} {unit}
            </span>
          )}
        </div>
        
        {/* Due indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {isCompleted ? 'Completed today' : 'Due today'}
        </div>

        {/* Celebratory Exceeded Goal Message */}
        {target > 0 && completedValue > target && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium leading-relaxed">
            MashAllah! You've exceeded your goal. You have read {completedValue - target} {unit.toLowerCase()} extra.
          </p>
        )}
      </div>

      {/* Right Side: Action Buttons */}
      <div className="z-10 shrink-0 flex items-center gap-2 sm:self-center self-end">
        {isReading && !isCompleted && (
          <Link
            href={getReadingLink()}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/20 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            Read Online ›
          </Link>
        )}
        {isCompleted ? (
          <button disabled className="bg-primary-100 text-primary-700 font-bold text-xs px-5 py-2.5 rounded-xl cursor-default flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Done
          </button>
        ) : (
          <button 
            onClick={handleMarkDone}
            disabled={isSubmitting}
            className="bg-[#bdf3df] hover:bg-[#a1ead0] text-[#0a6c4c] font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
          >
            {isSubmitting ? '...' : 'Mark Done'}
          </button>
        )}
      </div>
    </div>
  )
}
