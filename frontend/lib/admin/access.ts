import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type CurrentUserAccess = {
  userId: string
  email: string
  isAdmin: boolean
}

function pickText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function getCurrentUserAccess(): Promise<CurrentUserAccess | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  let isAdmin = false

  try {
    const adminSupabase = await createAdminClient()
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profileError) {
      const profileRecord = profile as { is_admin?: unknown } | null
      isAdmin = profileRecord?.is_admin === true
    }
  } catch {
    isAdmin = false
  }

  return {
    userId: user.id,
    email: pickText(user.email),
    isAdmin,
  }
}
