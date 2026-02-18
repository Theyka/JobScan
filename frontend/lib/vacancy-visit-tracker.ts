import type { VacancyRouteSource } from '@/lib/datatypes/vacancy-detail-data.types'
import { createAdminClient } from '@/lib/supabase/admin'

type TrackVacancyVisitInput = {
  source: VacancyRouteSource
  vacancyId: number | null
  slug: string
  visitorIp: string
}

function normalizeVacancyId(value: number | null): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  const rounded = Math.trunc(value)
  return rounded > 0 ? rounded : null
}

function normalizeSlug(value: string): string {
  return String(value ?? '').trim()
}

function normalizeVisitorIp(value: string): string {
  return String(value ?? '').trim().slice(0, 128)
}

export async function incrementVacancyVisitCounter(input: TrackVacancyVisitInput): Promise<void> {
  const vacancyId = normalizeVacancyId(input.vacancyId)
  if (vacancyId === null) {
    return
  }

  const slug = normalizeSlug(input.slug)
  const visitorIp = normalizeVisitorIp(input.visitorIp)
  if (!visitorIp) {
    return
  }

  try {
    const adminSupabase = await createAdminClient()
    const { error } = await adminSupabase.rpc('increment_vacancy_visit', {
      p_source: input.source,
      p_vacancy_id: vacancyId,
      p_slug: slug,
      p_visitor_ip: visitorIp,
    })

    if (error) {
      console.error(`increment_vacancy_visit failed: ${error.message}`)
    }
  } catch (error) {
    console.error('Failed to track vacancy visit', error)
  }
}
