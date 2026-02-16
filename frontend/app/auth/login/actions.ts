'use server'

import { redirect } from 'next/navigation'

import type { AuthActionState } from '@/lib/datatypes/auth.types'
import { createClient } from '@/lib/supabase/server'

function toText(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim()
}

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = toText(formData.get('email')).toLowerCase()
  const password = toText(formData.get('password'))

  if (!email || !password) {
    return {
      status: 'error',
      message: 'Email and password are required',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return {
      status: 'error',
      message: error.message,
    }
  }

  redirect('/')
}
