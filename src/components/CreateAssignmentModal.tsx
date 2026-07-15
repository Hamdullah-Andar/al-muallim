'use client'

import { useState } from 'react'
import { createAssignment } from '@/app/teacher/class/[id]/actions'

export default function CreateAssignmentModal({ 
  isOpen, 
  setIsOpen,
  classId
}: { 
  isOpen: boolean, 
  setIsOpen: (v: boolean) => void,
  classId: string
}) {
  const [category, setCategory] = useState('Zikr')
  const [customCategory, setCustomCategory] = useState('')
  const [trackingType, setTrackingType] = useState<'checkbox' | 'counter'>('counter')
  const [readingSource, setReadingSource] = useState<'library' | 'quran'>('quran')
  const [selectedBookId, setSelectedBookId] = useState('9')
  const [portionUnit, setPortionUnit] = useState('Ayah')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    formData.append('classId', classId)
    
    // If the tracking type radios are hidden, we must append the state value manually!
    if (category === 'Munkarat' || category === 'Prayer') {
      formData.set('trackingType', trackingType)
    } else if (category === 'Reading') {
      formData.set('trackingType', 'counter')
      formData.set('target', (formData.get('readingTarget') || '1') as string)
      formData.set('unit', portionUnit)
      formData.set('linkedBookId', readingSource === 'library' ? selectedBookId : 'quran')
      // Ensure title is descriptive if not customized
      if (!formData.get('title')) {
        const bookName = readingSource === 'library' 
          ? (selectedBookId === '9' ? 'Riyad as-Salihin' : selectedBookId === '7' ? 'Anwar ul-Quran / Tafsir' : 'Library Book')
          : 'Holy Quran Recitation'
        formData.set('title', `${bookName} (${formData.get('readingTarget') || '1'} ${portionUnit} daily)`)
      }
    }

    // If they selected Custom, use their typed-in category name or fallback to 'Custom'
    if (category === 'Custom') {
      formData.set('category', customCategory.trim() || 'Custom')
    }

    try {
      await createAssignment(formData)
      setIsOpen(false)
      alert(`Assignment created successfully!`)
      // Reset form defaults for next time
      setCategory('Zikr')
      setCustomCategory('')
      setTrackingType('counter')
    } catch (error) {
      console.error(error)
      alert("Failed to create assignment. Make sure your database migration ran successfully.")
    } finally {
      setIsLoading(false)
    }
  }

  // Pre-filled dynamic categories based on user feedback
  const categories = ["Zikr", "Reading", "Prayer", "Nawafil", "Sport", "Munkarat", "Custom"]

  // Available Academy Library Books
  const libraryBooks = [
    { id: '9', title: 'Riyad as-Salihin (The Gardens of the Righteous)' },
    { id: '7', title: 'Anwar ul-Quran / Tafsir Ibn Kathir' },
    { id: 'cont-fiqh', title: 'Fiqh Simplified: Core Principles' },
    { id: 'cont-history', title: 'History of the Caliphs' },
    { id: 'cont-tafsir', title: 'Gems of Tafsir' },
    { id: 'feat-1', title: 'The Marvels of Creation: Foundations of Islamic Science' },
    { id: '1', title: 'Introduction to Hadith' },
    { id: '8', title: 'Hisnul Muslim (Fortress of the Muslim)' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-primary-900 p-6 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold font-arabic">Create Assignment</h2>
            <p className="text-primary-100 text-sm mt-1">Assign a new daily task</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Step 1: Category Selection */}
          <div>
            <label className="block text-sm font-bold mb-2 opacity-80">Category</label>
            <select 
              name="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                if (e.target.value === 'Prayer' || e.target.value === 'Munkarat') {
                  setTrackingType('checkbox')
                } else if (e.target.value !== 'Custom' && e.target.value !== 'Reading') {
                  setTrackingType('counter')
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium appearance-none"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Optional: Custom Category Input */}
          {category === 'Custom' && (
            <div className="animate-in slide-in-from-top-2">
              <label className="block text-sm font-bold mb-2 opacity-80">Custom Category Name</label>
              <input 
                type="text" 
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                required
                placeholder="e.g., Charity"
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          )}

          {/* Step 2: Task Title */}
          <div>
            <label className="block text-sm font-bold mb-2 opacity-80">Task Title</label>
            {(category === 'Munkarat' || category === 'Prayer') ? (
              <input 
                key="readonly-title"
                type="text" 
                name="title"
                readOnly
                value={category === 'Munkarat' ? "Avoid five sense Munkarat" : "Five time Jamat prayer"}
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 opacity-70 cursor-not-allowed outline-none font-bold"
              />
            ) : (
              <input 
                key="editable-title"
                type="text" 
                name="title"
                required
                placeholder={
                  category === 'Zikr' ? "e.g., Astaghfirullah" : 
                  category === 'Reading' ? "e.g., Daily Recitation / Tafsir Portion" : 
                  "What exactly should they do?"
                }
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            )}
          </div>

          {/* SPECIALIZED READING & QURAN CONFIGURATION */}
          {category === 'Reading' && (
            <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 62v12m8-8H4" /></svg>
                <span>Reading / Scripture Source</span>
              </div>

              {/* Source Radio Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReadingSource('quran')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${readingSource === 'quran' ? 'border-emerald-600 bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold' : 'border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}
                >
                  <span className="text-lg">📖</span>
                  <span className="text-xs font-bold">Holy Quran Recitation</span>
                  <span className="text-[10px] opacity-75">Quran.com / Hard Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReadingSource('library')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${readingSource === 'library' ? 'border-emerald-600 bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold' : 'border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}
                >
                  <span className="text-lg">📚</span>
                  <span className="text-xs font-bold">Academy Library Book</span>
                  <span className="text-[10px] opacity-75">Tafsir, Hadith, Fiqh</span>
                </button>
              </div>

              {/* Library Book Dropdown */}
              {readingSource === 'library' && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">Select Book from Library</label>
                  <select
                    value={selectedBookId}
                    onChange={e => setSelectedBookId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-white dark:bg-black text-xs font-medium outline-none"
                  >
                    {libraryBooks.map(b => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Portion Unit & Target Count */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-500/10">
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">Portion Unit</label>
                  <select
                    value={portionUnit}
                    onChange={e => setPortionUnit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-white dark:bg-black text-xs font-medium outline-none"
                  >
                    <option value="Ayah">Ayah / Ayat</option>
                    <option value="Roba">Roba / Quarter</option>
                    <option value="Hadith">Hadith</option>
                    <option value="Page">Page(s)</option>
                    <option value="Chapter">Chapter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">Daily Portion Goal</label>
                  <input
                    type="number"
                    name="readingTarget"
                    defaultValue="1"
                    min="1"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-white dark:bg-black text-xs font-bold outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tracking Type Selector (Hidden for Munkarat, Prayer, and Reading) */}
          {category !== 'Munkarat' && category !== 'Prayer' && category !== 'Reading' && (
            <div>
              <label className="block text-sm font-bold mb-3 opacity-80">How is this tracked?</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all ${trackingType === 'counter' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-black/5 dark:border-white/5 hover:border-black/20'}`}>
                  <input type="radio" name="trackingType" value="counter" checked={trackingType === 'counter'} onChange={() => setTrackingType('counter')} className="hidden" />
                  <span className="text-2xl mb-2">🔢</span>
                  <span className="font-bold text-sm">Target Number</span>
                  <span className="text-xs opacity-60 mt-1">Has a specific count</span>
                </label>
                <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all ${trackingType === 'checkbox' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-black/5 dark:border-white/5 hover:border-black/20'}`}>
                  <input type="radio" name="trackingType" value="checkbox" checked={trackingType === 'checkbox'} onChange={() => setTrackingType('checkbox')} className="hidden" />
                  <span className="text-2xl mb-2">✅</span>
                  <span className="font-bold text-sm">Done / Not Done</span>
                  <span className="text-xs opacity-60 mt-1">Simple checkbox</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Dynamic Fields (Only shows if Counter is selected and not Reading!) */}
          {trackingType === 'counter' && category !== 'Munkarat' && category !== 'Prayer' && category !== 'Reading' && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-sm font-bold mb-2 opacity-80">Target Count</label>
                <input 
                  type="number" 
                  name="target"
                  required
                  min="1"
                  placeholder="e.g., 200"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 opacity-80">Unit</label>
                <input 
                  type="text" 
                  name="unit"
                  required
                  placeholder={
                    category === 'Zikr' ? "Times" : 
                    category === 'Sport' ? "Minutes" : "Unit"
                  }
                  className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 border-t border-black/5 dark:border-white/5">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create Assignment
                </>
              )}
            </button>
            <p className="text-center text-xs opacity-60 mt-3 font-medium text-primary-600 dark:text-primary-400">
              This assignment will automatically repeat daily.
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}
