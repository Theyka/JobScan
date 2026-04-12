'use server'

import { createClient } from '@/lib/supabase/server'

export type Notification = {
  id: number
  type: string
  title: string
  body: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  created_at: string
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function getUserNotifications(limit = 20): Promise<Notification[]> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('id,type,title,body,metadata,is_read,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data
}

export async function getUnreadCount(): Promise<number> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return 0

  const supabase = await createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) return 0
  return count ?? 0
}

export async function markNotificationRead(notificationId: number): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  return {}
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) return { error: error.message }
  return {}
}
