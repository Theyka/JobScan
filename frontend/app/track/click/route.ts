import { createHash } from 'crypto'

import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'

type VacancyRouteSource = 'jobsearch' | 'glorri'

function normalizeRouteSource(value: string): VacancyRouteSource | null {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'jobsearch' || normalized === 'jobsearch.az') {
    return 'jobsearch'
  }
  if (normalized === 'glorri') {
    return 'glorri'
  }
  return null
}

function normalizeTargetUrl(value: string): string {
  const raw = String(value ?? '').trim()
  if (!raw || /^javascript:/i.test(raw)) {
    return ''
  }

  if (/^(https?:|mailto:|tel:)/i.test(raw)) {
    return raw
  }

  if (/^www\./i.test(raw)) {
    return `https://${raw}`
  }

  return ''
}

function normalizeVacancyId(value: string): number | null {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

function normalizeSlug(value: string): string {
  return String(value ?? '').trim().slice(0, 512)
}

function normalizeIpCandidate(value: string | null): string {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  const first = raw.split(',')[0]?.trim() ?? ''
  if (!first) {
    return ''
  }

  if (first.startsWith('::ffff:')) {
    return first.slice(7)
  }

  return first
}

function getVisitorIpFromRequest(request: Request): string {
  const candidates = [
    request.headers.get('cf-connecting-ip'),
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
    request.headers.get('x-client-ip'),
    request.headers.get('true-client-ip'),
    request.headers.get('x-vercel-forwarded-for'),
  ]

  for (const candidate of candidates) {
    const normalized = normalizeIpCandidate(candidate)
    if (normalized) {
      return normalized
    }
  }

  return ''
}

function hashVisitorIp(ip: string): string {
  const normalized = String(ip ?? '').trim()
  if (!normalized) {
    return ''
  }

  return createHash('sha256').update(normalized).digest('hex')
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const target = normalizeTargetUrl(url.searchParams.get('target') ?? '')

  if (!target) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const source = normalizeRouteSource(url.searchParams.get('source') ?? '')
  const vacancyId = normalizeVacancyId(url.searchParams.get('vacancy_id') ?? '')
  const slug = normalizeSlug(url.searchParams.get('slug') ?? '')

  if (source && vacancyId !== null) {
    try {
      const adminSupabase = await createAdminClient()
      const visitorHash = hashVisitorIp(getVisitorIpFromRequest(request))

      await adminSupabase.from('vacancy_clicks').insert({
        source,
        vacancy_id: vacancyId,
        slug,
        visitor_hash: visitorHash,
        target_url: target,
      })
    } catch (error) {
      console.error('Failed to track vacancy click', error)
    }
  }

  return NextResponse.redirect(target, { status: 307 })
}
