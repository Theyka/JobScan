import { createAdminClient } from '@/lib/supabase/admin'

export async function getTranslationEnabled(): Promise<boolean> {
  const client = await createAdminClient()
  const { data } = await client
    .from('app_settings')
    .select('value')
    .eq('key', 'translation_enabled')
    .single()

  // Default to true if row doesn't exist yet
  if (!data) return true
  return data.value !== 'false'
}

export async function setTranslationEnabled(enabled: boolean): Promise<void> {
  const client = await createAdminClient()
  const { error } = await client.from('app_settings').upsert(
    { key: 'translation_enabled', value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  )
  if (error) throw new Error(error.message)
}
