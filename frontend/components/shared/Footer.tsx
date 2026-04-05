export default function Footer() {
  return (
    <footer className="w-full bg-[#151515] border-t border-white/5 text-white">
      <div className="mx-auto w-full max-w-345 px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          
          {/* Logo & Info */}
          <div className="flex flex-col items-center gap-4 md:items-start text-center md:text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">
                Job<span className="text-[#d4ae72]">Scan</span>
              </span>
              <span className="rounded-full bg-[#d4ae72]/14 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#e4c58f]">
                Beta
              </span>
            </div>
            <p className="max-w-xs text-sm font-medium text-white/60">
              Aggregating and analyzing the IT job market in Azerbaijan with precision.
              <span className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-white/30">
                © 2026 JobScan — Created and maintained by Theyka
              </span>
              <span className="mt-2 block text-[11px] text-white/45">
                Open source under GNU AGPL v3 with public source availability.
              </span>
            </p>
          </div>

          {/* Links & Attribution */}
          <div className="flex flex-col items-center gap-8 md:items-end">
            <div className="flex flex-col items-center md:items-end gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Data Sources</span>
              <div className="flex items-center gap-3">
                <a href="https://jobsearch.az" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white transition-colors hover:text-[#e4c58f]">
                  JobSearch.az
                </a>
                <span className="text-white/20">/</span>
                <a href="https://glorri.com" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white transition-colors hover:text-[#e4c58f]">
                  Glorri
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
              <a
                href="https://github.com/Theyka/JobScan"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#d4ae72]/25 bg-[#d4ae72]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#f0d3a6] transition-colors hover:border-[#d4ae72]/45 hover:bg-[#d4ae72]/15"
              >
                Source Code
              </a>
              <a
                href="https://github.com/Theyka/JobScan/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/65 transition-colors hover:border-white/20 hover:text-white"
              >
                GNU AGPL v3
              </a>
            </div>

            <a 
              href="https://github.com/Theyka" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group flex items-center gap-3 rounded-lg border border-white/5 bg-white/3 px-5 py-2.5 transition-all hover:border-[#d4ae72]/35 hover:bg-white/5 hover:shadow-xl"
            >
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Project by</span>
                <span className="text-xs font-bold text-white transition-colors group-hover:text-[#e4c58f]">Theyka</span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#151515] shadow-sm transition-transform group-hover:scale-105">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                </svg>
              </div>
            </a>
          </div>

        </div>
      </div>
    </footer>
  )
}

