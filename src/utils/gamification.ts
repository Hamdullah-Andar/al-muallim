import { SupabaseClient } from '@supabase/supabase-js'

export async function calculateStudentStats(supabase: SupabaseClient, studentId: string) {
  // Fetch all completed progress sorted by date descending
  const { data: progress } = await supabase
    .from('student_progress')
    .select('tracking_date')
    .eq('student_id', studentId)
    .eq('is_completed', true)
    .order('tracking_date', { ascending: false })

  if (!progress || progress.length === 0) {
    return { currentStreak: 0, knowledgePoints: 0, completedTasks: 0 }
  }

  const completedTasks = progress.length
  const knowledgePoints = completedTasks * 10 // 10 points per task

  // Calculate Streak
  // A streak is consecutive days of having AT LEAST ONE completed task.
  // Extract unique dates
  const uniqueDates = Array.from(new Set(progress.map(p => p.tracking_date)))
  
  let currentStreak = 0;
  const today = new Date();
  
  // Normalize today to YYYY-MM-DD
  const todayStr = today.toISOString().split('T')[0];
  
  // Yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If they haven't done anything today OR yesterday, streak is 0
  if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
    return { currentStreak: 0, knowledgePoints, completedTasks }
  }

  let checkDate = new Date(uniqueDates[0]); // Start with the most recent date
  
  for (let i = 0; i < uniqueDates.length; i++) {
    const d = uniqueDates[i];
    const expectedStr = checkDate.toISOString().split('T')[0];
    
    if (d === expectedStr) {
      currentStreak++;
      // go back one day for the next iteration
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break; // Streak broken
    }
  }

  return { currentStreak, knowledgePoints, completedTasks }
}
