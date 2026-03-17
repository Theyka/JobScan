'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getCurrentUserAccess } from '@/lib/admin/access'
import { deleteManagedUser, setManagedUserAdminStatus } from '@/lib/admin/user-management'

function toText(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim()
}

function parseBoolean(value: string): boolean | null {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return null
}

export async function updateManagedUserAdminAction(formData: FormData): Promise<void> {
  const access = await getCurrentUserAccess()

  if (!access) {
    redirect('/auth/login')
  }

  if (!access.isAdmin) {
    redirect('/')
  }

  const targetUserId = toText(formData.get('target_user_id'))
  const nextIsAdmin = parseBoolean(toText(formData.get('next_is_admin')).toLowerCase())

  if (!targetUserId || nextIsAdmin === null) {
    revalidatePath('/admin/user')
    return
  }

  if (targetUserId === access.userId && nextIsAdmin === false) {
    revalidatePath('/admin/user')
    return
  }

  try {
    await setManagedUserAdminStatus(targetUserId, nextIsAdmin)
  } finally {
    revalidatePath('/admin/user')
    revalidatePath('/admin')
  }
}

export async function deleteManagedUserAction(formData: FormData): Promise<void> {
  const access = await getCurrentUserAccess()

  if (!access) {
    redirect('/auth/login')
  }

  if (!access.isAdmin) {
    redirect('/')
  }

  const targetUserId = toText(formData.get('target_user_id'))

  if (!targetUserId || targetUserId === access.userId) {
    revalidatePath('/admin/user')
    return
  }

  try {
    await deleteManagedUser(targetUserId)
  } finally {
    revalidatePath('/admin/user')
    revalidatePath('/admin')
  }
}
