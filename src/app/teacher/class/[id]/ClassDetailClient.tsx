'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import CreateAssignmentButton from '@/components/CreateAssignmentButton'
import { uploadClassBook, deleteClassBook } from './actions'
import { createClient } from '@/utils/supabase/client'

interface ClassDetailClientProps {
  classData: any
  students: any[]
  assignments: any[]
  books: any[]
}

export default function ClassDetailClient({ classData, students = [], assignments = [], books = [] }: ClassDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'assignments' | 'books' | 'discussions'>('overview')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isSubmittingBook, setIsSubmittingBook] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleBookSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmittingBook(true)
    setUploadError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('classId', classData.id)

    try {
      // Direct client upload to Supabase Storage completely bypasses 1MB server action limits!
      const pdfFile = formData.get('pdfFile') as File | null
      if (pdfFile && pdfFile.size > 0 && pdfFile.name && pdfFile.name !== 'undefined') {
        const supabase = createClient()
        const fileName = `class_${classData.id}/${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const { data: uploadData, error: storageError } = await supabase.storage
          .from('library-pdfs')
          .upload(fileName, pdfFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (storageError) {
          throw new Error(`Could not upload PDF file to storage: ${storageError.message}. Make sure you created a public storage bucket named 'library-pdfs' in Supabase.`)
        }

        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('library-pdfs')
            .getPublicUrl(fileName)
          formData.set('fileUrl', publicUrl)
          formData.delete('pdfFile') // Remove file so Server Action payload is < 1 KB
        }
      }

      await uploadClassBook(formData)
      setIsUploadModalOpen(false)
      alert(`MashAllah! "${formData.get('title')}" has been uploaded to ${classData.name}'s library!`)
    } catch (err: any) {
      console.error('Book upload failed:', err)
      setUploadError(err.message || 'Failed to upload book. Make sure you ran migrations/02_class_books.sql and have a public bucket named library-pdfs in Supabase.')
    } finally {
      setIsSubmittingBook(false)
    }
  }

  async function handleDeleteBook(bookId: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}" from this class library?`)) return
    try {
      await deleteClassBook(bookId, classData.id)
    } catch (err: any) {
      alert('Failed to delete book: ' + err.message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER HERO */}
      <div className="bg-primary-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <Link href="/teacher/dashboard" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span className="text-sm font-bold tracking-wider uppercase">Back to Dashboard</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-arabic tracking-tight">{classData.name}</h1>
            <p className="text-lg opacity-80 max-w-2xl leading-relaxed">
              {classData.description || 'Welcome to your class dashboard. From here you can manage students, assignments, and track progress.'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center min-w-[200px] shadow-inner">
            <p className="text-xs uppercase tracking-widest font-bold opacity-70 mb-2">Class Code</p>
            <p className="text-4xl font-mono font-bold tracking-[0.2em]">{classData.class_code}</p>
          </div>
        </div>
        
        {/* Decorative background shapes */}
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute right-64 -bottom-32 w-80 h-80 bg-primary-500/30 rounded-full blur-3xl"></div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-8 border-b border-black/10 dark:border-white/10 px-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-4 font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-4 font-bold transition-all whitespace-nowrap ${
            activeTab === 'students'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-4 font-bold transition-all whitespace-nowrap ${
            activeTab === 'assignments'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          Assignments ({assignments.length})
        </button>
        <button
          onClick={() => setActiveTab('books')}
          className={`pb-4 font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'books'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <span>Class Library ({books.length})</span>
          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full">NEW</span>
        </button>
        <button
          onClick={() => setActiveTab('discussions')}
          className={`pb-4 font-bold transition-all whitespace-nowrap ${
            activeTab === 'discussions'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          Discussions
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* LEFT COLUMN */}
          <div className="xl:col-span-2 space-y-8">
            {/* Students Roster Summary */}
            <div className="bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Student Roster</h2>
                  <p className="text-sm opacity-60 font-medium mt-1">Manage the students enrolled in this class.</p>
                </div>
                <button
                  onClick={() => setActiveTab('students')}
                  className="text-sm font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                >
                  View All ({students.length})
                </button>
              </div>
              
              {students && students.length > 0 ? (
                <div className="divide-y divide-black/5 dark:divide-white/5 max-h-[350px] overflow-y-auto">
                  {students.map((student) => (
                    <div key={student.id} className="p-6 md:px-8 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-lg">
                          {student.profiles?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{student.profiles?.full_name || 'Unknown Student'}</p>
                          <p className="text-sm opacity-60 font-medium">Enrolled Student</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-emerald-600">Active</p>
                        <p className="text-xs opacity-60 font-medium uppercase tracking-wider">Status</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 md:p-20 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Students Yet</h3>
                  <p className="text-base opacity-70 max-w-md mx-auto mb-8">
                    Your class is currently empty. Share the Class Code <strong className="font-mono text-primary-600 dark:text-primary-400">{classData.class_code}</strong> with your students so they can join!
                  </p>
                </div>
              )}
            </div>

            {/* Class Library Books Summary */}
            <div className="bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Class Library ({books.length})</h2>
                  <p className="text-sm opacity-60 font-medium mt-1">Books & resources assigned to students in this class.</p>
                </div>
                <button
                  onClick={() => setActiveTab('books')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span>Upload Book</span>
                </button>
              </div>

              {books && books.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {books.slice(0, 4).map((book: any) => (
                    <div key={book.id} className="p-4 rounded-xl border border-black/10 dark:border-white/10 flex items-center gap-4 hover:border-emerald-500 transition-colors bg-black/[0.01] dark:bg-white/[0.01]">
                      <div className="w-12 h-16 rounded bg-gradient-to-br from-[#193a2c] to-[#0c1f17] shrink-0 flex flex-col items-center justify-center p-1 text-center shadow">
                        <div className="w-2 h-2 rounded-full bg-amber-300 mb-1"></div>
                        <p className="text-[7px] font-bold text-white line-clamp-2">{book.title}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {book.category || 'BOOK'}
                        </span>
                        <h4 className="text-sm font-bold truncate mt-1">{book.title}</h4>
                        <p className="text-xs opacity-60 truncate">{book.author || 'Instructor'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl">
                  <p className="text-sm opacity-60 font-medium mb-3">No books uploaded to this class yet.</p>
                  <button
                    onClick={() => setActiveTab('books')}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    + Add first class book now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            {/* Quick Actions Panel */}
            <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
              <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
              <div className="space-y-4">
                <CreateAssignmentButton classId={classData.id} />
                
                <button
                  onClick={() => setActiveTab('books')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold transition-colors group"
                >
                  <div className="bg-emerald-600 text-white shadow-sm p-3 rounded-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-lg">Upload Class Book</p>
                    <p className="text-xs opacity-70 font-medium">Add PDF to student library</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Active Assignments Panel */}
            <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Active Assignments</h2>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View All →
                </button>
              </div>
              
              {assignments && assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.slice(0, 5).map(assignment => (
                    <div key={assignment.id} className="p-4 rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-between hover:border-primary-500 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            {assignment.category}
                          </span>
                          {assignment.tracking_type === 'counter' && (
                            <span className="text-xs opacity-60 font-medium">
                              Target: {assignment.content.target} {assignment.content.unit}
                            </span>
                          )}
                          {assignment.tracking_type === 'checkbox' && (
                            <span className="text-xs opacity-60 font-medium">Daily Checkbox</span>
                          )}
                        </div>
                        <p className="font-bold text-lg">{assignment.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl">
                  <h3 className="text-lg font-bold mb-1">No assignments yet</h3>
                  <p className="opacity-60 text-sm font-medium">Create your first daily assignment above.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden p-6 md:p-8">
          <div className="flex justify-between items-center mb-6 border-b border-black/5 dark:border-white/5 pb-6">
            <div>
              <h2 className="text-2xl font-bold">Enrolled Students ({students.length})</h2>
              <p className="text-sm opacity-60 font-medium mt-1">Class Code: <strong className="font-mono text-primary-600">{classData.class_code}</strong></p>
            </div>
          </div>
          {students.length > 0 ? (
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {students.map((student) => (
                <div key={student.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-lg">
                      {student.profiles?.full_name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{student.profiles?.full_name || 'Unknown Student'}</p>
                      <p className="text-xs opacity-60">Student ID: {student.student_id}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">Active</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-12 opacity-60">No students enrolled yet.</p>
          )}
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-6">
            <div>
              <h2 className="text-2xl font-bold">All Assignments ({assignments.length})</h2>
              <p className="text-sm opacity-60 font-medium mt-1">Create and manage daily tasks for this class.</p>
            </div>
            <CreateAssignmentButton classId={classData.id} />
          </div>
          <div className="space-y-4">
            {assignments.map(assignment => (
              <div key={assignment.id} className="p-5 rounded-2xl border border-black/10 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    {assignment.category}
                  </span>
                  <h3 className="font-bold text-lg mt-2">{assignment.title}</h3>
                  <p className="text-xs opacity-60 mt-1">
                    {assignment.tracking_type === 'counter' ? `Target: ${assignment.content.target} ${assignment.content.unit}` : 'Daily Checkbox Habit'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CLASS LIBRARY & BOOKS */}
      {activeTab === 'books' && (
        <div className="bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden p-6 md:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/5 dark:border-white/5 pb-6">
            <div>
              <h2 className="text-2xl font-bold">Class Library & Books ({books.length})</h2>
              <p className="text-sm opacity-60 font-medium mt-1">
                Books uploaded here will instantly appear in the <strong className="text-emerald-600 dark:text-emerald-400">Library</strong> page for students enrolled in this class.
              </p>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-sm flex items-center gap-2 transition-all shadow-md shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span>+ Upload Class Book / PDF</span>
            </button>
          </div>

          {/* Books Roster */}
          {books && books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book: any) => (
                <div key={book.id} className="bg-[#fbfbfb] dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-[#193a2c] to-[#0c1f17] shadow-md shrink-0 flex flex-col items-center justify-center p-2 text-center border border-white/10">
                      <div className="w-3 h-3 rounded-full border border-amber-300/60 mb-1"></div>
                      <p className="text-[9px] font-bold text-white leading-tight line-clamp-3">{book.title}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="inline-block bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide mb-1">
                        {book.category || 'CLASS RESOURCE'}
                      </span>
                      <h3 className="font-bold text-base text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{book.author || 'Class Instructor'}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{book.pages || 100} pages</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {book.description || 'Assigned reading material for students enrolled in this class.'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
                    <a
                      href={book.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Preview PDF</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Delete Book"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-black/10 dark:border-white/10 rounded-3xl space-y-3">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-lg font-bold">No Books Uploaded Yet</h3>
              <p className="text-sm opacity-60 max-w-md mx-auto">
                Upload PDFs or study materials here. Enrolled students will immediately see them in their library catalog.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs mt-2 inline-flex items-center gap-2"
              >
                + Upload First Class Book
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DISCUSSIONS */}
      {activeTab === 'discussions' && (
        <div className="bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-8 text-center">
          <p className="opacity-60">Class discussions feature active.</p>
        </div>
      )}

      {/* UPLOAD BOOK MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161616] rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-black/10 dark:border-white/10 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Book to {classData.name}</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {uploadError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-bold leading-relaxed border border-red-200 dark:border-red-800/40">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Book Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Tafsir Anwar ul Quran"
                  className="w-full bg-[#f4f7f6] dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Author / Scholar
                  </label>
                  <input
                    type="text"
                    name="author"
                    placeholder="e.g. Shaykh Ahmed..."
                    className="w-full bg-[#f4f7f6] dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Page Count
                  </label>
                  <input
                    type="number"
                    name="pages"
                    defaultValue="150"
                    className="w-full bg-[#f4f7f6] dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Category *
                </label>
                <select
                  name="category"
                  className="w-full bg-[#f4f7f6] dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="Quran & Tafsir">Quran & Tafsir</option>
                  <option value="Hadith Studies">Hadith Studies</option>
                  <option value="Islamic History">Islamic History</option>
                  <option value="Arabic Language">Arabic Language</option>
                  <option value="Contemporary Issues">Contemporary Issues (Fiqh)</option>
                  <option value="Zikr & Adhkar">Zikr & Adhkar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Short description for the student library card..."
                  className="w-full bg-[#f4f7f6] dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                  Provide Book File (Choose ONE)
                </label>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Option A: Upload PDF File (to Supabase Storage)
                  </label>
                  <input
                    type="file"
                    name="pdfFile"
                    accept=".pdf,.epub"
                    className="w-full text-xs font-medium file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                </div>

                <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">— OR —</div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Option B: Paste Direct Web URL to PDF
                  </label>
                  <input
                    type="url"
                    name="fileUrl"
                    placeholder="https://example.com/book.pdf"
                    className="w-full bg-white dark:bg-black/60 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBook}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md"
                >
                  {isSubmittingBook ? 'Uploading Book...' : 'Save Book to Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
