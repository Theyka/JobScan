'use server'

import { createClient } from '@/lib/supabase/server'

export type FavoriteVacancy = {
  source: string
  vacancy_id: number
}

export type FavoriteCompany = {
  source: string
  company_id: number
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function getUserFavoriteVacancies(): Promise<FavoriteVacancy[]> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_favorite_vacancies')
    .select('source,vacancy_id')
    .eq('user_id', userId)

  if (error || !data) return []
  return data
}

export async function getUserFavoriteCompanies(): Promise<FavoriteCompany[]> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_favorite_companies')
    .select('source,company_id')
    .eq('user_id', userId)

  if (error || !data) return []
  return data
}

export async function addFavoriteVacancy(source: string, vacancyId: number): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { error: 'Not authenticated' }

  const normalizedSource = source === 'jobsearch.az' ? 'jobsearch' : source

  const supabase = await createClient()
  const { error } = await supabase
    .from('user_favorite_vacancies')
    .insert({ user_id: userId, source: normalizedSource, vacancy_id: vacancyId })

  if (error) return { error: error.message }
  return {}
}

export async function removeFavoriteVacancy(source: string, vacancyId: number): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { error: 'Not authenticated' }

  const normalizedSource = source === 'jobsearch.az' ? 'jobsearch' : source

  const supabase = await createClient()
  const { error } = await supabase
    .from('user_favorite_vacancies')
    .delete()
    .eq('user_id', userId)
    .eq('source', normalizedSource)
    .eq('vacancy_id', vacancyId)

  if (error) return { error: error.message }
  return {}
}

export async function addFavoriteCompany(source: string, companyId: number): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { error: 'Not authenticated' }

  const normalizedSource = source === 'jobsearch.az' ? 'jobsearch' : source

  const supabase = await createClient()
  const { error } = await supabase
    .from('user_favorite_companies')
    .insert({ user_id: userId, source: normalizedSource, company_id: companyId })

  if (error) return { error: error.message }
  return {}
}

export async function removeFavoriteCompany(source: string, companyId: number): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { error: 'Not authenticated' }

  const normalizedSource = source === 'jobsearch.az' ? 'jobsearch' : source

  const supabase = await createClient()
  const { error } = await supabase
    .from('user_favorite_companies')
    .delete()
    .eq('user_id', userId)
    .eq('source', normalizedSource)
    .eq('company_id', companyId)

  if (error) return { error: error.message }
  return {}
}
