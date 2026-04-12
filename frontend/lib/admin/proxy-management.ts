import { createAdminClient } from '@/lib/supabase/admin'

export type ProxyRow = {
  id: number
  url: string
  isActive: boolean
  failCount: number
  lastUsedAt: string | null
  createdAt: string
}

type RawProxyRow = {
  id: number | null
  url: string | null
  is_active: boolean | null
  fail_count: number | null
  last_used_at: string | null
  created_at: string | null
}

function toRow(raw: RawProxyRow): ProxyRow | null {
  if (!raw.id || !raw.url) return null
  return {
    id: raw.id,
    url: raw.url,
    isActive: raw.is_active ?? true,
    failCount: raw.fail_count ?? 0,
    lastUsedAt: raw.last_used_at ?? null,
    createdAt: raw.created_at ?? '',
  }
}

export async function listProxies(): Promise<ProxyRow[]> {
  const client = await createAdminClient()
  const { data, error } = await client
    .from('proxies')
    .select('id,url,is_active,fail_count,last_used_at,created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const rows = Array.isArray(data) ? (data as RawProxyRow[]) : []
  return rows.map(toRow).filter((r): r is ProxyRow => r !== null)
}

export async function addProxies(urls: string[]): Promise<void> {
  const clean = [...new Set(urls.map((u) => u.trim()).filter(Boolean))]
  if (!clean.length) return

  const client = await createAdminClient()
  const payload = clean.map((url) => ({ url }))
  const { error } = await client
    .from('proxies')
    .upsert(payload, { onConflict: 'url', ignoreDuplicates: true })

  if (error) throw new Error(error.message)
}

export async function setProxyActive(proxyId: number, isActive: boolean): Promise<void> {
  const client = await createAdminClient()
  const { error } = await client.from('proxies').update({ is_active: isActive }).eq('id', proxyId)
  if (error) throw new Error(error.message)
}

export async function removeProxy(proxyId: number): Promise<void> {
  const client = await createAdminClient()
  const { error } = await client.from('proxies').delete().eq('id', proxyId)
  if (error) throw new Error(error.message)
}
