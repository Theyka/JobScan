import { createAdminClient } from '@/lib/supabase/admin'

type ProfileRow = {
  id: string | null
  username: string | null
  first_name: string | null
  last_name: string | null
  is_admin: boolean | null
  created_at: string | null
}

export type ManagedUser = {
  id: string
  username: string
  firstName: string
  lastName: string
  isAdmin: boolean
  createdAt: string
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const adminSupabase = await createAdminClient()

  const { data, error } = await adminSupabase
    .from('profiles')
    .select('id,username,first_name,last_name,is_admin,created_at')
    .order('is_admin', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const rows = Array.isArray(data) ? (data as ProfileRow[]) : []
  return rows
    .map((row) => {
      const id = toText(row.id)

      return {
        id,
        username: toText(row.username),
        firstName: toText(row.first_name),
        lastName: toText(row.last_name),
        isAdmin: row.is_admin === true,
        createdAt: toText(row.created_at),
      }
    })
    .filter((row) => Boolean(row.id))
}

export async function setManagedUserAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
  const adminSupabase = await createAdminClient()
  const { error } = await adminSupabase.from('profiles').update({ is_admin: isAdmin }).eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }
}
