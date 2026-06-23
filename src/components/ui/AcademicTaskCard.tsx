'use client'

import { useState } from 'react'
import { toggleAssignmentProgress } from '@/app/student/dashboard/actions'

interface AcademicTaskCardProps {
  assignment: any;
  initialProgress: any;
}

export default function AcademicTaskCard({ assignment, initialProgress }: AcademicTaskCardProps) {
  const [isCompleted, setIsCompleted] = useState(initialProgress?.is_completed || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // In the future, this priority could come from the assignment JSONB metadata
  const isHighPriority = assignment.category === 'QURAN' || assignment.category === 'TARJOMA'

  const handleMarkDone = async () => {
    if (isCompleted || isSubmitting) return
    setIsSubmitting(true)

    // Optimistic UI
    setIsCompleted(true)

    try {
      // toggleAssignmentProgress handles upsert AND revalidatePath
      await toggleAssignmentProgress(assignment.id, true, null)
    } catch (e) {
      console.error(e)
      setIsCompleted(false) // Revert on failure
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className={`bg-white dark:bg-black/40 rounded-2xl border ${isCompleted ? 'border-primary-500/30' : 'border-black/5 dark:border-white/5'} shadow-sm p-5 flex items-center justify-between transition-all hover:shadow-md relative overflow-hidden`}>
      
      {/* Optional Success Background Overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/10 pointer-events-none"></div>
      )}

      {/* Left Side: Title and Priority */}
      <div className="flex-1 mr-4 z-10">
        <div className="flex items-center gap-3 mb-2">
          <h3 className={`font-bold ${isCompleted ? 'text-primary-800 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
            {assignment.title}
          </h3>
          
          {/* Priority Badge */}
          {isHighPriority ? (
            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              High Priority
            </span>
          ) : (
             <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Medium Priority
            </span>
          )}
        </div>
        
        {/* Due indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           {isCompleted ? 'Completed today' : 'Due today'}
        </div>
      </div>

      {/* Right Side: Action Button */}
      <div className="z-10 shrink-0">
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
