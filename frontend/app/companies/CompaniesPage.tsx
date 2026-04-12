'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { CompaniesData, CompanyListItem } from '@/lib/datatypes/companies.types'
import { addFavoriteCompany, getUserFavoriteCompanies, removeFavoriteCompany } from '@/lib/favorites'
import { createClient } from '@/lib/supabase/client'

const PAGE_SIZE = 24
type SourceFilter = 'all' | 'jobsearch' | 'glorri'

function CompanyCard({
  company,
  isFavorite,
  onToggleFavorite,
}: {
  company: CompanyListItem
  isFavorite: boolean
  onToggleFavorite: (source: string, companyId: number) => void
}) {
  const primarySource = company.sources[0]
  const detailHref = `/companies/${company.primarySource}/${company.slug}`

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[1.25rem] border border-black/8 bg-white transition-colors duration-200 hover:border-black/14 dark:border-white/8 dark:bg-white/4 dark:hover:border-white/14">
      <Link href={detailHref} className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          {company.logo ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/8 bg-[#f8f6f3] p-1.5 dark:border-white/8 dark:bg-white/6">
              <Image
                src={company.logo}
                alt={company.name}
                width={44}
                height={44}
                unoptimized
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-xl font-black uppercase text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
              {(company.name.charAt(0) || 'C').toUpperCase()}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {company.sources.map((src) => (
              <span
                key={src.key}
                className="rounded-md border border-black/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:text-slate-400"
              >
                {src.key === 'jobsearch' ? 'JS' : 'GL'}
              </span>
            ))}
          </div>
        </div>

        <h3 className="mb-1.5 line-clamp-2 text-base font-bold tracking-tight text-slate-900 dark:text-white">
          {company.name}
        </h3>

        <p className="mt-auto pt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {company.vacancyCount} {company.vacancyCount === 1 ? 'vacancy' : 'vacancies'}
        </p>
      </Link>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(primarySource.key, primarySource.companyId)
        }}
        className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-lg border border-black/8 bg-white/80 text-slate-400 transition-all hover:border-red-200 hover:text-red-500 dark:border-white/10 dark:bg-white/6 dark:text-slate-500 dark:hover:border-red-400/30 dark:hover:text-red-400"
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite ? (
          <svg className="h-4.5 w-4.5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        ) : (
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default function CompaniesPage({ data }: { data: CompaniesData }) {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [favoriteCompanyIds, setFavoriteCompanyIds] = useState<Set<string>>(new Set())
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true)
        void getUserFavoriteCompanies().then((favs) => {
          const ids = new Set(favs.map((f) => `${f.source}-${f.company_id}`))
          setFavoriteCompanyIds(ids)
        })
      }
    })
  }, [])

  const handleToggleFavorite = useCallback(async (source: string, companyId: number) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }

    const key = `${source}-${companyId}`
    const wasFavorite = favoriteCompanyIds.has(key)

    setFavoriteCompanyIds((prev) => {
      const next = new Set(prev)
      if (wasFavorite) next.delete(key)
      else next.add(key)
      return next
    })

    const result = wasFavorite
      ? await removeFavoriteCompany(source, companyId)
      : await addFavoriteCompany(source, companyId)

    if (result.error) {
      setFavoriteCompanyIds((prev) => {
        const reverted = new Set(prev)
        if (wasFavorite) reverted.add(key)
        else reverted.delete(key)
        return reverted
      })
    }
  }, [favoriteCompanyIds, isLoggedIn])

  const filtered = useMemo(() => {
    let result = data.companies

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((c) => c.name.toLowerCase().includes(q))
    }

    if (sourceFilter !== 'all') {
      result = result.filter((c) => c.sources.some((s) => s.key === sourceFilter))
    }

    return result
  }, [data.companies, search, sourceFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageCompanies = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <>
      <main className="relative mx-auto flex max-w-345 grow flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">Companies</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {data.total} companies hiring in IT across Azerbaijan
          </p>
        </div>

        {/* Search & Filters Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search companies..."
              className="h-12 w-full rounded-xl border border-black/8 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#8a6a43]/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#d7b37a]/40"
            />
          </label>

          <div className="flex gap-2">
            {(['all', 'jobsearch', 'glorri'] as const).map((key) => {
              const labels: Record<SourceFilter, string> = { all: 'All', jobsearch: 'JobSearch', glorri: 'Glorri' }
              const isActive = sourceFilter === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setSourceFilter(key); setCurrentPage(1) }}
                  className={`rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'border-[#8a6a43] bg-[#8a6a43] text-white dark:border-[#d7b37a] dark:bg-[#d7b37a] dark:text-[#151515]'
                      : 'border-black/8 bg-white text-slate-600 hover:border-black/14 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white'
                  }`}
                >
                  {labels[key]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Results count */}
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {filtered.length} {filtered.length === 1 ? 'company' : 'companies'} found
        </p>

        {/* Company Grid */}
        {pageCompanies.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageCompanies.map((company) => {
              const primarySrc = company.sources[0]
              const favKey = `${primarySrc.key}-${primarySrc.companyId}`
              return (
                <CompanyCard
                  key={company.uid}
                  company={company}
                  isFavorite={favoriteCompanyIds.has(favKey)}
                  onToggleFavorite={handleToggleFavorite}
                />
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-black/8 bg-[#f8f6f3] dark:border-white/8 dark:bg-white/6">
              <svg className="h-8 w-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No companies found</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-black/8 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-[#f8f6f3] disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>

            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {safePage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-black/8 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-[#f8f6f3] disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Next
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : null}
      </main>

      {showLoginPrompt ? (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowLoginPrompt(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-black/8 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1a1a1a]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8f6f3] dark:bg-white/6">
              <svg className="h-6 w-6 text-[#8a6a43] dark:text-[#d7b37a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Sign in to save favorites</h3>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Create an account or sign in to save companies to your favorites list.</p>
            <div className="flex gap-3">
              <Link href="/auth/login" className="flex-1 rounded-lg bg-[#8a6a43] py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-[#765936] dark:bg-[#d7b37a] dark:text-[#151515] dark:hover:bg-[#c9a15e]">Sign in</Link>
              <button type="button" onClick={() => setShowLoginPrompt(false)} className="flex-1 rounded-lg border border-black/8 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

    </>
  )
}
