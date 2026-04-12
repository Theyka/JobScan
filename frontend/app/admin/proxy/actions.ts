'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getCurrentUserAccess } from '@/lib/admin/access'
import { setTranslationEnabled } from '@/lib/admin/app-settings'
import { addProxies, removeProxy, setProxyActive } from '@/lib/admin/proxy-management'

async function requireAdmin() {
  const access = await getCurrentUserAccess()
  if (!access) redirect('/auth/login')
  if (!access.isAdmin) redirect('/')
  return access
}

function normalizeProxyEntry(entry: string): string {
  const trimmed = entry.trim()
  if (!trimmed) return ''

  // Strip scheme prefix to normalize, then re-parse
  const withoutScheme = trimmed.replace(/^https?:\/\//i, '')
  const parts = withoutScheme.split(':')

  // host:port:user:pass
  if (parts.length === 4) {
    const [host, port, user, pass] = parts
    return `http://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}`
  }

  // host:port — no credentials, scheme was already present or not
  if (parts.length === 2) {
    return `http://${withoutScheme}`
  }

  // Already a proper URL like http://user:pass@host:port (scheme present, host has no extra colons)
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  // fallback: return as-is and let the DB constraint reject it
  return trimmed
}

export async function addProxiesAction(formData: FormData): Promise<void> {
  await requireAdmin()

  const raw = String(formData.get('urls') ?? '').trim()
  const urls = raw
    .split(/[\n,]+/)
    .map(normalizeProxyEntry)
    .filter(Boolean)

  if (urls.length > 0) {
    await addProxies(urls)
  }

  revalidatePath('/admin/proxy')
}

export async function toggleProxyAction(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = parseInt(String(formData.get('proxy_id') ?? ''), 10)
  const next = formData.get('next_is_active') === 'true'

  if (!Number.isFinite(id)) {
    revalidatePath('/admin/proxy')
    return
  }

  await setProxyActive(id, next)
  revalidatePath('/admin/proxy')
}

export async function deleteProxyAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = parseInt(String(formData.get('proxy_id') ?? ''), 10)

  if (!Number.isFinite(id)) {
    revalidatePath('/admin/proxy')
    return
  }

  await removeProxy(id)
  revalidatePath('/admin/proxy')
}

export async function setTranslationEnabledAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const enabled = formData.get('enabled') === 'true'
  await setTranslationEnabled(enabled)
  revalidatePath('/admin/proxy')
}
