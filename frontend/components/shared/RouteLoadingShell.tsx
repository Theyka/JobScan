type RouteLoadingVariant = 'jobs' | 'companies' | 'detail' | 'form' | 'auth' | 'admin' | 'notifications'

function SimpleLoadingEffect() {
  return (
    <div className="flex min-h-[42vh] items-center justify-center py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/12 border-t-[#8a6a43] dark:border-white/12 dark:border-t-[#d7b37a]" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/44 dark:text-white/44">
          Loading
        </p>
      </div>
    </div>
  )
}

export default function RouteLoadingShell({ variant = 'jobs' }: { variant?: RouteLoadingVariant }) {
  const containerClassName =
    variant === 'jobs'
      ? 'relative mx-auto flex max-w-420 flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8'
      : 'relative mx-auto flex w-full max-w-345 grow flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8'

  return (
    <main className={containerClassName}>
      <SimpleLoadingEffect />
    </main>
  )
}

