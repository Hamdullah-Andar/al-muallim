'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// ==========================================
// 1. Fetch Posts
// ==========================================
export async function fetchClassDiscussions(classId: string) {
  const supabase = await createClient()

  // Fetch posts with author details
  const { data: posts, error } = await supabase
    .from('class_discussions')
    .select(`
      *,
      author:profiles(id, full_name, role)
    `)
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching discussions:', error)
    return { success: false, data: [] }
  }

  // Fetch reply counts separately (a simple way without complex RPCs)
  const postIds = posts.map(p => p.id)
  
  let replyCounts: Record<string, number> = {}
  if (postIds.length > 0) {
    const { data: replies, error: replyError } = await supabase
      .from('discussion_replies')
      .select('post_id')
      .in('post_id', postIds)

    if (!replyError && replies) {
      replies.forEach(r => {
        replyCounts[r.post_id] = (replyCounts[r.post_id] || 0) + 1
      })
    }
  }

  const postsWithCounts = posts.map(p => ({
    ...p,
    reply_count: replyCounts[p.id] || 0
  }))

  return { success: true, data: postsWithCounts }
}

// ==========================================
// 2. Fetch Single Thread with Replies
// ==========================================
export async function fetchDiscussionThread(postId: string) {
  const supabase = await createClient()

  // Fetch the main post
  const { data: post, error: postError } = await supabase
    .from('class_discussions')
    .select(`
      *,
      author:profiles(id, full_name, role)
    `)
    .eq('id', postId)
    .single()

  if (postError || !post) {
    console.error('Error fetching post:', postError)
    return { success: false, post: null, replies: [] }
  }

  // Fetch replies
  const { data: replies, error: repliesError } = await supabase
    .from('discussion_replies')
    .select(`
      *,
      author:profiles(id, full_name, role)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (repliesError) {
    console.error('Error fetching replies:', repliesError)
  }

  return { 
    success: true, 
    post, 
    replies: replies || [] 
  }
}

// ==========================================
// 3. Create Post
// ==========================================
export async function createDiscussionPost(
  classId: string, 
  title: string, 
  message: string, 
  isAnnouncement: boolean = false
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const { error } = await supabase
    .from('class_discussions')
    .insert({
      class_id: classId,
      author_id: user.id,
      title,
      message,
      is_announcement: isAnnouncement
    })

  if (error) {
    console.error('Error creating post:', error)
    return { success: false, message: error.message }
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath(`/student/class/${classId}`)
  return { success: true }
}

// ==========================================
// 4. Create Reply
// ==========================================
export async function createReply(postId: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  // Check if post is locked
  const { data: post } = await supabase
    .from('class_discussions')
    .select('is_locked, class_id')
    .eq('id', postId)
    .single()

  if (post?.is_locked) {
    return { success: false, message: 'This thread is locked.' }
  }

  const { error } = await supabase
    .from('discussion_replies')
    .insert({
      post_id: postId,
      author_id: user.id,
      message
    })

  if (error) {
    console.error('Error creating reply:', error)
    return { success: false, message: error.message }
  }

  if (post?.class_id) {
    revalidatePath(`/teacher/class/${post.class_id}`)
    revalidatePath(`/student/class/${post.class_id}`)
  }
  
  return { success: true }
}

// ==========================================
// 5. Delete Post or Reply (Moderation)
// ==========================================
export async function deletePostOrReply(id: string, type: 'post' | 'reply', classId: string) {
  const supabase = await createClient()
  
  // Note: RLS currently allows deleting OWN posts/replies. 
  // For teachers to delete ANY post, we might need a trusted server client or modify RLS.
  // For now, we will rely on RLS (if teacher is author) or bypass RLS if we strictly check role.
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  // Check if user is a teacher
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') {
    // If not teacher, they can only delete their own. Let RLS handle it.
  } else {
    // If teacher, they should be able to delete anyone's post in their class.
    // For a robust implementation, RLS should allow teachers to delete rows where class_id matches their class.
    // Assuming RLS handles it, or we can use the service role key if needed. We'll stick to the standard client for now.
  }

  let table = type === 'post' ? 'class_discussions' : 'discussion_replies'
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    console.error(`Error deleting ${type}:`, error)
    return { success: false, message: error.message }
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath(`/student/class/${classId}`)
  return { success: true }
}

// ==========================================
// 6. Toggle Post Lock
// ==========================================
export async function togglePostLock(postId: string, currentLockState: boolean, classId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('class_discussions')
    .update({ is_locked: !currentLockState })
    .eq('id', postId)

  if (error) {
    console.error('Error toggling lock:', error)
    return { success: false, message: error.message }
  }

  revalidatePath(`/teacher/class/${classId}`)
  revalidatePath(`/student/class/${classId}`)
  return { success: true }
}
