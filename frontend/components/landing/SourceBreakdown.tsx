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
      icon: 'https://jobs.glorri.com/favicon.ico',
      color: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-50/80 border-blue-200/50 dark:bg-blue-500/5 dark:border-blue-500/10'
    },
    {
      label: 'JobSearch.az',
      value: data.stats.total_jsaz,
      icon: 'https://jobsearch.az/favicon.ico',
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50/80 border-emerald-200/50 dark:bg-emerald-500/5 dark:border-emerald-500/10'
    },
    {
      label: 'Overlap',
      value: data.stats.overlap,
      color: 'text-indigo-700 dark:text-indigo-400',
      bg: 'bg-indigo-50/80 border-indigo-200/50 dark:bg-indigo-500/5 dark:border-indigo-500/10'
    },
    {
      label: 'Unique',
      value: uniqueStat,
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50/80 border-amber-200/50 dark:bg-amber-500/5 dark:border-amber-500/10'
    },
  ]

  return (
    <section className="mb-10 rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Source Breakdown
        </h3>
        <div className="h-px grow mx-6 bg-slate-100 dark:bg-slate-800" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {sources.map((source) => (
          <div key={source.label} className={`flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all hover:shadow-md ${source.bg}`}>
            <div className="flex items-center gap-2">
              {source.icon && <img src={source.icon} className="h-4 w-4 rounded-sm" alt="" />}
              <span className={`text-[10px] font-black uppercase tracking-widest ${source.color}`}>
                {source.label}
              </span>
            </div>
            <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
              {new Intl.NumberFormat('en-US').format(source.value)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
