'use server'

import { redirect } from 'next/navigation'

import type { AuthActionState } from '@/lib/datatypes/auth.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function toText(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim()
}

export async function registerAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = toText(formData.get('email')).toLowerCase()
  const password = toText(formData.get('password'))
  const username = toText(formData.get('username'))
  const firstName = toText(formData.get('first_name'))
  const lastName = toText(formData.get('last_name'))

  if (!email || !password || !username || !firstName || !lastName) {
    return {
      status: 'error',
      message: 'All fields are required',
    }
  }

  if (password.length < 6) {
    return {
      status: 'error',
      message: 'Password must be at least 6 characters',
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        first_name: firstName,
        last_name: lastName,
      },
    },
  })

  if (error) {
    return {
      status: 'error',
      message: error.message,
    }
  }

  const userId = data.user?.id
  if (!userId) {
    return {
      status: 'error',
      message: 'Could not create account',
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
      id: userId,
      username,
      first_name: firstName,
      last_name: lastName,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return {
      status: 'error',
      message: profileError.message,
    }
  }

  if (data.session) {
    redirect('/')
  }

  return {
    status: 'success',
    message: 'Account created. Please check your email to confirm your account.',
  }
}
