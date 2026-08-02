'use client'

import { useState, useMemo } from 'react'

type ClassItem = { id: string; name: string; code: string }
type StudentItem = { studentId: string; fullName: string; email: string; classId: string; className: string; joinedAt: string }
type AssignmentItem = { id: string; classId: string; className: string; category: string; title: string; trackingType: string; isDaily: boolean }
type ProgressItem = { assignment_id: string; student_id: string; tracking_date: string; current_value: number; is_completed: boolean; updated_at: string }

export default function AnalyticsClient({
  teacherName,
  classes,
  students,
  assignments,
  progressRecords
}: {
  teacherName: string
  classes: ClassItem[]
  students: StudentItem[]
  assignments: AssignmentItem[]
  progressRecords: ProgressItem[]
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>('all')
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d')

  // Days count based on timeframe selection
  const daysCount = timeframe === '7d' ? 7 : 30

  // Filtered dataset base
  const filteredClasses = useMemo(() => {
    return selectedClassId === 'all' 
      ? classes 
      : classes.filter(c => c.id === selectedClassId)
  }, [classes, selectedClassId])

  const filteredAssignments = useMemo(() => {
    return selectedClassId === 'all'
      ? assignments
      : assignments.filter(a => a.classId === selectedClassId)
  }, [assignments, selectedClassId])

  const filteredStudents = useMemo(() => {
    return selectedClassId === 'all'
      ? students
      : students.filter(s => s.classId === selectedClassId)
  }, [students, selectedClassId])

  const assignmentIdSet = useMemo(() => {
    return new Set(filteredAssignments.map(a => a.id))
  }, [filteredAssignments])

  // Get date strings array for the selected timeframe window
  const dateRange = useMemo(() => {
    const dates: { dateStr: string; displayLabel: string; shortDay: string }[] = []
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const shortDay = daysOfWeek[d.getDay()]
      const month = d.toLocaleString('default', { month: 'short' })
      const dayNum = d.getDate()
      
      dates.push({
        dateStr,
        displayLabel: `${shortDay}, ${month} ${dayNum}`,
        shortDay: `${month} ${dayNum}`
      })
    }
    return dates
  }, [daysCount])

  const dateSet = useMemo(() => new Set(dateRange.map(d => d.dateStr)), [dateRange])

  // Filter progress records within the selected date range and class filter
  const relevantProgress = useMemo(() => {
    return progressRecords.filter(p => 
      assignmentIdSet.has(p.assignment_id) && 
      dateSet.has(p.tracking_date) &&
      p.is_completed
    )
  }, [progressRecords, assignmentIdSet, dateSet])

  // 1. Calculate overall metrics
  const uniqueStudentsCount = useMemo(() => {
    const ids = new Set(filteredStudents.map(s => s.studentId))
    return ids.size
  }, [filteredStudents])

  // Total expected task completions in period: 
  // (daily assignments for class) * (students in class) * (number of days in timeframe)
  const totalExpectedInPeriod = useMemo(() => {
    let expected = 0
    filteredClasses.forEach(c => {
      const classStudentsCount = students.filter(s => s.classId === c.id).length
      const classDailyAssignmentsCount = assignments.filter(a => a.classId === c.id && a.isDaily).length
      expected += classStudentsCount * classDailyAssignmentsCount * daysCount
    })
    return expected
  }, [filteredClasses, students, assignments, daysCount])

  const totalCompletedInPeriod = relevantProgress.length

  const overallCompletionRate = totalExpectedInPeriod > 0
    ? Math.min(100, Math.round((totalCompletedInPeriod / totalExpectedInPeriod) * 100))
    : 0

  // 2. Class Performance Comparison Matrix
  const classPerformanceList = useMemo(() => {
    return classes.map(c => {
      const classStudents = students.filter(s => s.classId === c.id)
      const classAssignments = assignments.filter(a => a.classId === c.id)
      const classAssignIds = new Set(classAssignments.map(a => a.id))
      
      const expected = classStudents.length * classAssignments.filter(a => a.isDaily).length * daysCount
      const completed = progressRecords.filter(p => 
        classAssignIds.has(p.assignment_id) && 
        dateSet.has(p.tracking_date) && 
        p.is_completed
      ).length

      const rate = expected > 0 ? Math.min(100, Math.round((completed / expected) * 100)) : 0

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        studentCount: classStudents.length,
        habitCount: classAssignments.length,
        completed,
        rate
      }
    })
  }, [classes, students, assignments, progressRecords, dateSet, daysCount])

  // Top performing class
  const topClass = useMemo(() => {
    if (classPerformanceList.length === 0) return null
    return [...classPerformanceList].sort((a, b) => b.rate - a.rate)[0]
  }, [classPerformanceList])

  // 3. Daily Completion Trend Data
  const dailyTrendData = useMemo(() => {
    return dateRange.map(d => {
      const dayCompleted = relevantProgress.filter(p => p.tracking_date === d.dateStr).length
      // Expected per day
      let expectedPerDay = 0
      filteredClasses.forEach(c => {
        const classStudentsCount = students.filter(s => s.classId === c.id).length
        const classDailyAssignCount = assignments.filter(a => a.classId === c.id && a.isDaily).length
        expectedPerDay += classStudentsCount * classDailyAssignCount
      })

      const rate = expectedPerDay > 0 
        ? Math.min(100, Math.round((dayCompleted / expectedPerDay) * 100)) 
        : 0

      return {
        dateStr: d.dateStr,
        label: d.shortDay,
        fullLabel: d.displayLabel,
        completedCount: dayCompleted,
        rate
      }
    })
  }, [dateRange, relevantProgress, filteredClasses, students, assignments])

  // 4. Category Performance Breakdown
  const categoryBreakdown = useMemo(() => {
    const categoriesMap: Record<string, { title: string; totalAssigned: number; completedCount: number }> = {}

    filteredAssignments.forEach(a => {
      const catName = a.category || 'General'
      if (!categoriesMap[catName]) {
        categoriesMap[catName] = { title: catName, totalAssigned: 0, completedCount: 0 }
      }
      categoriesMap[catName].totalAssigned += 1
    })

    // Count completions for each category
    relevantProgress.forEach(p => {
      const assign = assignments.find(a => a.id === p.assignment_id)
      if (assign) {
        const catName = assign.category || 'General'
        if (categoriesMap[catName]) {
          categoriesMap[catName].completedCount += 1
        }
      }
    })

    return Object.values(categoriesMap).map(cat => {
      // Calculate category score relative to total completed tasks
      const percent = totalCompletedInPeriod > 0
        ? Math.round((cat.completedCount / totalCompletedInPeriod) * 100)
        : 0

      return {
        name: cat.title,
        assigned: cat.totalAssigned,
        completed: cat.completedCount,
        percent
      }
    })
  }, [filteredAssignments, relevantProgress, assignments, totalCompletedInPeriod])

  // 5. Student Progress Leaderboard
  const studentLeaderboard = useMemo(() => {
    // Unique students from filtered list
    const studentMap: Record<string, { studentId: string; fullName: string; className: string; email: string; completedCount: number }> = {}

    filteredStudents.forEach(s => {
      if (!studentMap[s.studentId]) {
        studentMap[s.studentId] = {
          studentId: s.studentId,
          fullName: s.fullName,
          className: s.className,
          email: s.email,
          completedCount: 0
        }
      }
    })

    // Add completion count
    relevantProgress.forEach(p => {
      if (studentMap[p.student_id]) {
        studentMap[p.student_id].completedCount += 1
      }
    })

    return Object.values(studentMap).sort((a, b) => b.completedCount - a.completedCount)
  }, [filteredStudents, relevantProgress])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/5 dark:border-white/5 pb-6">
        <div>
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2">Portal <span className="mx-1">/</span> <span className="text-[#092B2B] dark:text-emerald-500">Analytics</span></p>
          <h1 className="text-4xl font-bold mb-1 font-arabic tracking-tight text-[#092B2B] dark:text-white">Classroom Performance Analytics</h1>
          <p className="text-sm text-gray-500 font-medium">
            Real-time spiritual progress, daily habits completion rates, and student engagement metrics.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Selector */}
          <div className="bg-white dark:bg-[#1a1a1a] p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase text-gray-400 pl-3">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-[#f4f7f6] dark:bg-black/50 border border-black/5 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs font-bold text-[#092B2B] dark:text-white focus:outline-none"
            >
              <option value="all">All Classrooms ({classes.length})</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Timeframe Toggle Pills */}
          <div className="flex bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 shadow-sm p-1.5 rounded-2xl">
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === '7d' 
                  ? 'bg-[#092B2B] dark:bg-emerald-600 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === '30d' 
                  ? 'bg-[#092B2B] dark:bg-emerald-600 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Overall Completion Rate */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Completion Rate</p>
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
              {timeframe === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </span>
          </div>
          <h3 className="text-3xl font-extrabold text-[#092B2B] dark:text-white mb-3">{overallCompletionRate}%</h3>
          <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${overallCompletionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Active Enrolled Students */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Enrolled Students</p>
          <h3 className="text-3xl font-extrabold text-[#092B2B] dark:text-white mb-1">{uniqueStudentsCount}</h3>
          <p className="text-xs text-gray-500 font-medium">Active in selected classroom scope</p>
        </div>

        {/* Total Active Habits */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Assigned Habits</p>
          <h3 className="text-3xl font-extrabold text-[#092B2B] dark:text-white mb-1">{filteredAssignments.length}</h3>
          <p className="text-xs text-gray-500 font-medium">Daily spiritual assignments</p>
        </div>

        {/* Top Performing Class */}
        <div className="bg-white dark:bg-black/40 p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Top Class</p>
          <h3 className="text-xl font-extrabold text-[#092B2B] dark:text-white truncate mb-1">
            {topClass ? topClass.name : 'N/A'}
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            {topClass ? `${topClass.rate}% Completion Rate` : 'No class data yet'}
          </p>
        </div>

      </div>

      {/* DAILY COMPLETION TREND VISUALIZER (BAR CHART) */}
      <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#092B2B] dark:text-white">Daily Completion Trend</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Daily percentage of completed spiritual habits by enrolled students ({timeframe === '7d' ? 'Last 7 Days' : 'Last 30 Days'})
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block"></span>
              <span>Completion %</span>
            </div>
          </div>
        </div>

        {/* BAR CHART GRAPH */}
        <div className="pt-4">
          <div className="h-56 flex items-end justify-between gap-2 md:gap-4 border-b border-black/10 dark:border-white/10 pb-2 overflow-x-auto">
            {dailyTrendData.map((d, i) => (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center min-w-[28px] max-w-[56px] h-full justify-end group relative">
                
                {/* Hover Tooltip */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#092B2B] text-white text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none z-10 whitespace-nowrap shadow-lg">
                  <p>{d.fullLabel}</p>
                  <p className="text-emerald-300">{d.completedCount} completed ({d.rate}%)</p>
                </div>

                {/* Bar Label Score */}
                <span className="text-[10px] font-extrabold text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.rate}%
                </span>

                {/* Bar Column */}
                <div className="w-full bg-black/5 dark:bg-white/5 rounded-t-lg flex items-end overflow-hidden h-full">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                    style={{ height: `${Math.max(d.rate, 4)}%` }}
                  ></div>
                </div>

                {/* Date Label */}
                <span className="text-[10px] font-extrabold text-gray-400 mt-2 truncate w-full text-center">
                  {timeframe === '7d' ? d.label : d.label.split(' ')[1]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRID: CATEGORY BREAKDOWN & CLASS PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Performance Breakdown */}
        <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#092B2B] dark:text-white">Habits by Category</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Distribution of completed tasks across spiritual habit categories</p>
          </div>

          {categoryBreakdown.length === 0 ? (
            <p className="text-xs opacity-60 text-center py-8">No category data available for selection.</p>
          ) : (
            <div className="space-y-5">
              {categoryBreakdown.map(cat => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-[#092B2B] dark:text-white">{cat.name}</span>
                    <span className="text-gray-500">{cat.completed} completed ({cat.percent}% share)</span>
                  </div>
                  <div className="w-full bg-black/5 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(cat.percent * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Performance Comparison Matrix */}
        <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#092B2B] dark:text-white">Classrooms Summary</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Comparative overview of all active classrooms</p>
          </div>

          <div className="divide-y divide-black/5 dark:divide-white/5">
            {classPerformanceList.map(c => (
              <div key={c.id} className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-[#092B2B] dark:text-white truncate">{c.name}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {c.studentCount} Students • {c.habitCount} Habits
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{c.rate}%</span>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{c.completed} Completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* STUDENT LEADERBOARD & PROGRESS ROSTER */}
      <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#092B2B] dark:text-white">Enrolled Students Roster</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Student activity logs and completion scores for the selected timeframe</p>
        </div>

        {studentLeaderboard.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
            <p className="text-xs opacity-60 font-medium">No enrolled students found in this scope.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                  <th className="pb-3 pl-2">Student</th>
                  <th className="pb-3">Classroom</th>
                  <th className="pb-3 text-center">Completed Tasks</th>
                  <th className="pb-3 text-right pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs font-medium">
                {studentLeaderboard.map((student) => (
                  <tr key={student.studentId} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {student.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#092B2B] dark:text-white text-sm">{student.fullName}</p>
                          <p className="text-[11px] text-gray-400">{student.email || 'Enrolled Student'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                        {student.className}
                      </span>
                    </td>
                    <td className="py-4 text-center font-bold text-sm text-[#092B2B] dark:text-white">
                      {student.completedCount}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        student.completedCount > 0 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                          : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                      }`}>
                        {student.completedCount > 0 ? 'Active' : 'No logs'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
