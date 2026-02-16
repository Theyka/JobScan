import type { LandingData } from '@/lib/datatypes/landing-data.types'

type SourceBreakdownProps = {
  data: LandingData
}

export default function SourceBreakdown({ data }: SourceBreakdownProps) {
  const uniqueStat = data.stats.unique_glorri + data.stats.unique_jsaz

  return (
    <div className="mb-8">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-xs font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500">
          Source Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center gap-1.5">
              <img src="https://jobs.glorri.com/favicon.ico" className="h-4 w-4 rounded-sm" alt="" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Glorri</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.total_glorri}</span>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-lg border border-green-100 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-1.5">
              <img src="https://jobsearch.az/favicon.ico" className="h-4 w-4 rounded-sm" alt="" />
              <span className="text-xs font-bold text-green-600 dark:text-green-400">JobSearch.az</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.total_jsaz}</span>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-lg border border-purple-100 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Overlap</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.overlap}</span>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-lg border border-yellow-100 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Unique</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueStat}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
