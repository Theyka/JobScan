export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/60 bg-white py-12 dark:border-slate-800/60 dark:bg-slate-950">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Job<span className="text-indigo-600">Scan</span></span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">Beta</span>
            </div>
            <p className="max-w-xs text-center text-sm font-medium text-slate-500 dark:text-slate-400 md:text-left">
              Aggregating and analyzing the IT job market in Azerbaijan with precision.
              <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">© 2026 JobScan — Azerbaijani IT Market Intelligence</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 md:items-end">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Data Sources</span>
                <div className="mt-1 flex gap-3">
                  <a
                    href="https://jobsearch.az"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-slate-900 transition-colors hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                  >
                    JobSearch.az
                  </a>
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <a
                    href="https://glorri.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-slate-900 transition-colors hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                  >
                    Glorri
                  </a>
                </div>
              </div>
            </div>

            <a
              href="https://github.com/Theyka"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 transition-all hover:border-indigo-500/30 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-indigo-500/50"
            >
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Project by</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Theyka</span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm dark:bg-slate-800">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}
