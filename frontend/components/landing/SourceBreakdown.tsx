/* eslint-disable @next/next/no-img-element */
import type { LandingData } from '@/lib/datatypes/landing-data.types'

type SourceBreakdownProps = {
  data: LandingData
}

export default function SourceBreakdown({ data }: SourceBreakdownProps) {
  const uniqueStat = data.stats.unique_glorri + data.stats.unique_jsaz

  const sources = [
    {
      label: 'Glorri',
      value: data.stats.total_glorri,
      detail: 'Marketplace feed',
      icon: 'https://jobs.glorri.com/favicon.ico',
    },
    {
      label: 'JobSearch.az',
      value: data.stats.total_jsaz,
      detail: 'Publisher feed',
      icon: 'https://jobsearch.az/favicon.ico',
    },
    {
      label: 'Overlap',
      value: data.stats.overlap,
      detail: 'Detected duplicates',
    },
    {
      label: 'Unique roles',
      value: uniqueStat,
      detail: 'Non-duplicated inventory',
    },
  ]

  return (
    <section className="corporate-panel mb-10 overflow-hidden rounded-2xl px-6 py-6 sm:px-8 sm:py-7">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="corporate-kicker">Source Integrity</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Coverage split across both channels
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-[color-mix(in_srgb,var(--foreground)_66%,transparent)]">
          This is where the product starts to feel credible: the page makes the raw source relationship visible instead
          of hiding it behind a generic template.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sources.map((source) => (
          <div
            key={source.label}
            className="rounded-xl border border-(--line) bg-[color-mix(in_srgb,var(--surface-strong)_85%,white_15%)] px-5 py-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {source.icon ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-(--line) bg-background">
                    <img src={source.icon} className="h-4 w-4 rounded-sm object-contain" alt="" />
                  </span>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-(--line) bg-(--accent-soft) text-[11px] font-semibold uppercase tracking-[0.16em] text-(--accent)">
                    {source.label.slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{source.label}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--foreground)_44%,transparent)]">
                    {source.detail}
                  </p>
                </div>
              </div>
            </div>
            <p className="metric-value mt-6 text-4xl font-semibold tracking-[-0.06em] text-foreground">
              {new Intl.NumberFormat('en-US').format(source.value)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
