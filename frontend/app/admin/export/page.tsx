import { redirect } from 'next/navigation'

import AdminSectionNav from '@/components/admin/AdminSectionNav'
import CSVPreviewTable from '@/components/admin/CSVPreviewTable'
import LandingTopBar from '@/components/landing/LandingTopBar'
import Footer from '@/components/shared/Footer'
import { getCurrentUserAccess } from '@/lib/admin/access'
import { buildJobsCsvPreview } from '@/lib/admin/jobs-export'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export default async function AdminExportPage() {
  const access = await getCurrentUserAccess()

  if (!access) {
    redirect('/auth/login')
  }

  if (!access.isAdmin) {
    redirect('/')
  }

  const previewLimit = 10
  let rows: any[] = []
  let totalRows = 0
  let previewRows = 0
  let previewError = ''

  try {
    const preview = await buildJobsCsvPreview(previewLimit)
    rows = preview.rows
    totalRows = preview.totalRows
    previewRows = preview.previewRows
  } catch (error) {
    previewError = error instanceof Error ? error.message : 'Failed to prepare data preview.'
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#111111] dark:text-slate-100">
      <div className="sticky top-0 z-120 w-full border-b border-black/20 bg-[#151515]">
        <div className="mx-auto max-w-345 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <LandingTopBar />
        </div>
      </div>

      <main className="relative mx-auto flex max-w-345 flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full py-6 lg:py-10">
        <AdminSectionNav current="export" />

        <section className="mb-10 rounded-3xl border border-black/8 bg-white p-6 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/8 bg-[#f8f6f3] text-[#8a6a43] dark:border-white/8 dark:bg-white/6 dark:text-[#d7b37a]">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Export Hub</h1>
                <p className="mt-1.5 text-sm font-semibold text-slate-400 dark:text-slate-500">
                  Review data integrity before finalizing the extraction
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-row items-center gap-3 rounded-xl border border-black/8 bg-[#f8f6f3] p-2.5 px-4 dark:border-white/8 dark:bg-white/6 sm:gap-6 sm:p-3 sm:px-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 sm:text-[10px]">Total Available</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">{formatNumber(totalRows)}</span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 sm:text-[10px]">Previewing First</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">{formatNumber(previewRows)}</span>
                </div>
              </div>

              <a
                href="/admin/export/download"
                className="group flex h-14 items-center justify-center gap-4 rounded-xl border border-[#8a6a43] bg-[#8a6a43] px-8 text-xs font-black uppercase tracking-widest text-white transition-colors hover:border-[#765936] hover:bg-[#765936] active:scale-95 dark:border-[#d7b37a] dark:bg-[#d7b37a] dark:text-[#151515] dark:hover:border-[#c9a15e] dark:hover:bg-[#c9a15e]"
              >
                <svg className="h-5 w-5 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/8 bg-white p-6 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] sm:p-10">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Example Output</h2>
            <div className="flex items-center gap-3">
              <span className="rounded-xl border border-black/8 bg-[#f8f6f3] px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#8a6a43] dark:border-white/8 dark:bg-white/6 dark:text-[#d7b37a]">Double-Click Row to Inspect</span>
            </div>
          </div>

          {previewError ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/10">
              <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="mt-4 text-sm font-bold text-red-600 dark:text-red-400">Preview Error: {previewError}</p>
            </div>
          ) : rows.length > 0 ? (
            <CSVPreviewTable rows={rows} />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Empty Selection</p>
            </div>
          )}
        </section>
      </div>
      </main>

      <Footer />
    </div>
  )
}


