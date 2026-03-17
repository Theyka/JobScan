import type { LandingData } from '@/lib/datatypes/landing-data.types'

type StatsCardsProps = {
  data: LandingData
}

export default function StatsCards({ data }: StatsCardsProps) {
  const coverageRate = data.total_jobs ? Math.round((data.jobs_with_tech / data.total_jobs) * 100) : 0

  const stats = [
    {
      label: 'Roles tracked',
      value: data.total_jobs,
      detail: 'Combined vacancy inventory',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      ),
    },
    {
      label: 'Lead technology',
      value: data.top_language || 'No clear signal',
      detail: 'Highest recurring stack mention',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 013.138-3.138z" />
      ),
    },
    {
      label: 'Coverage depth',
      value: `${coverageRate}%`,
      detail: `${new Intl.NumberFormat('en-US').format(data.jobs_with_tech)} roles with stack data`,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      ),
    },
    {
      label: 'Signals captured',
      value: data.total_techs,
      detail: 'Distinct technology mentions',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      ),
    },
  ]

  return (
    <section className="mb-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="corporate-kicker">Performance Summary</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Market intelligence at a glance
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[color-mix(in_srgb,var(--foreground)_66%,transparent)]">
          A cleaner executive layer over the raw vacancy feed, focused on scale, coverage, and skill demand.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="corporate-panel group relative overflow-hidden rounded-xl p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6"
          >
            <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(186,149,81,0.7),transparent)]" />
            <div className="flex flex-col gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-(--line) bg-(--accent-soft) text-(--accent)">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {stat.icon}
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--foreground)_46%,transparent)]">
                  {stat.label}
                </p>
                <p className="metric-value mt-3 text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl">
                  {typeof stat.value === 'number' ? new Intl.NumberFormat('en-US').format(stat.value) : stat.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-[color-mix(in_srgb,var(--foreground)_66%,transparent)]">
                  {stat.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
