'use server'

import { revalidatePath } from 'next/cache'

import type { ProfileActionState } from '@/lib/datatypes/profile.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function toText(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim()
}

export async function updateProfileAction(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const firstName = toText(formData.get('first_name'))
  const lastName = toText(formData.get('last_name'))
  const username = toText(formData.get('username'))
  const techStackRaw = toText(formData.get('tech_stack'))

  let techStack: string[] = []
  try {
    const parsed = JSON.parse(techStackRaw || '[]')
    if (Array.isArray(parsed)) {
      techStack = parsed.filter((item: unknown) => typeof item === 'string')
    }
  } catch {
    techStack = []
  }

  if (!firstName || !lastName || !username) {
    return {
      status: 'error',
      message: 'First name, last name, and username are required.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      status: 'error',
      message: 'Please log in again.',
    }
  }

  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      username,
    },
  })

  if (authUpdateError) {
    return {
      status: 'error',
      message: authUpdateError.message,
    }
  }

  let adminSupabase: Awaited<ReturnType<typeof createAdminClient>>
  try {
    adminSupabase = await createAdminClient()
  } catch {
    return {
      status: 'error',
      message: 'Server auth configuration is incomplete. Please contact support.',
    }
  }

  const { error: profileError } = await adminSupabase.from('profiles').upsert(
    {
      id: user.id,
      username,
      first_name: firstName,
      last_name: lastName,
      tech_stack: techStack,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return {
      status: 'error',
      message: profileError.message,
    }
  }

  revalidatePath('/profile')
  revalidatePath('/')

  return {
    status: 'success',
    message: 'Profile updated successfully.',
  }
}
