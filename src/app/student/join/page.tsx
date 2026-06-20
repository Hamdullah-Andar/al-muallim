'use client'

import { useState } from 'react'
import { joinClass } from './actions'
import Link from 'next/link'

export default function JoinClassPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('classCode', code)

    const res = await joinClass(formData)
    
    // If the Server Action returns an error object, display it
    if (res?.error) {
      setError(res.error)
      setIsLoading(false)
    }
    // If successful, Next.js will automatically redirect us!
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-black dark:text-white flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-black/5 dark:border-white/5 animate-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <h1 className="text-3xl font-bold font-arabic mb-2">Join a Class</h1>
          <p className="text-black/60 dark:text-white/60">Enter the 6-character code provided by your teacher to get started.</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 opacity-80 text-center">Class Code</label>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="e.g. 8E81F4"
              className="w-full text-center text-3xl tracking-[0.5em] px-4 py-4 rounded-xl border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-mono font-bold uppercase"
              required
            />
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading || code.length !== 6}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Join Class'
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-black/5 dark:border-white/5 pt-6">
          <Link href="/dashboard" className="text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
