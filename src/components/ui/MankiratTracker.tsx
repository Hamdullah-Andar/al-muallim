'use client'

import { useState } from 'react'

export default function MankiratTracker() {
  // Purely visual state for demonstration purposes
  const [senses, setSenses] = useState([
    { name: 'Mouth', percentage: 40, icon: '👄' },
    { name: 'Nose', percentage: 20, icon: '👃' },
    { name: 'Eye', percentage: 65, icon: '👁️' },
    { name: 'Ear', percentage: 30, icon: '👂' },
    { name: 'Touch', percentage: 15, icon: '✋' }
  ])

  const decreasePercentage = (index: number) => {
    setSenses(prev => {
      const newSenses = [...prev]
      newSenses[index].percentage = Math.max(0, newSenses[index].percentage - 5)
      return newSenses
    })
  }

  return (
    <div className="bg-white dark:bg-black/40 rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm p-6">
       <div className="flex justify-between items-center mb-6">
         <div>
           <h3 className="font-bold text-gray-900 dark:text-white text-lg">Avoid Munkarat</h3>
           <p className="text-xs text-gray-500 mt-1">Decrease your bad actions daily towards 0%</p>
         </div>
         <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
           Spiritual Detox
         </span>
       </div>

       <div className="space-y-4">
         {senses.map((sense, idx) => (
           <div key={sense.name} className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-lg shadow-inner">
               {sense.icon}
             </div>
             
             <div className="flex-1">
               <div className="flex justify-between text-xs font-bold mb-1">
                 <span className="text-gray-700 dark:text-gray-300 uppercase tracking-widest">{sense.name}</span>
                 <span className={sense.percentage === 0 ? 'text-primary-500' : 'text-orange-600'}>
                   {sense.percentage}%
                 </span>
               </div>
               
               {/* Reverse Progress Bar (Red/Orange to Green) */}
               <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${sense.percentage}%`, 
                      backgroundColor: sense.percentage > 50 ? '#ef4444' : sense.percentage > 0 ? '#f97316' : '#22c55e'
                    }}
                  ></div>
               </div>
             </div>

             <button 
               onClick={() => decreasePercentage(idx)}
               disabled={sense.percentage === 0}
               className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                 sense.percentage === 0 
                   ? 'border-primary-200 text-primary-300 bg-primary-50 cursor-default' 
                   : 'border-orange-200 text-orange-600 hover:bg-orange-50 active:scale-90 cursor-pointer'
               }`}
             >
               {sense.percentage === 0 ? (
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
               ) : (
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
               )}
             </button>
           </div>
         ))}
       </div>
    </div>
  )
}
