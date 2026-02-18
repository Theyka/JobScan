import { redirect } from 'next/navigation'

import AdminSectionNav from '@/components/admin/AdminSectionNav'
import CSVPreviewTable from '@/components/admin/CSVPreviewTable'
import Footer from '@/components/shared/Footer'
import SiteHeader from '@/components/shared/SiteHeader'
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
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 transition-colors duration-300 dark:bg-[#020617] dark:text-slate-100">
      {/* Sticky Header Wrapper */}
      <div className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-[#0f172a]/80">
        <div className="container mx-auto max-w-7xl px-4">
          <SiteHeader
            className="border-none !pb-4 !pt-4"
            title="Export Hub"
            subtitle="Platform data extraction and review"
          />
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        <AdminSectionNav current="export" />

        {/* Export Controls Card */}
        <section className="mb-10 rounded-[2.5rem] border border-slate-300/50 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <span className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Export</h1>
                <p className="mt-1.5 text-sm font-semibold text-slate-400 dark:text-slate-500">
                  Review data integrity before finalizing the extraction
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-6 rounded-2xl bg-slate-50 border border-slate-200 p-3 px-6 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Available</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{formatNumber(totalRows)}</span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Previewing First</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{formatNumber(previewRows)}</span>
                </div>
              </div>

              <a
                href="/admin/export/download"
                className="group flex h-16 items-center justify-center gap-4 rounded-[1.5rem] bg-indigo-600 px-10 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-700/30 active:scale-95"
              >
                <svg className="h-5 w-5 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
              </a>
            </div>
          </div>
        </section>

        {/* Data Preview Section */}
        <section className="rounded-[2.5rem] border border-slate-300/50 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-10">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Example Output</h2>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-slate-50 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-900/40 dark:text-slate-500">Double-Click Row to Inspect</span>
            </div>
          </div>

          {previewError ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50/20 dark:border-red-900/30 dark:bg-red-900/10">
              <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="mt-4 text-sm font-bold text-red-600 dark:text-red-400">Preview Error: {previewError}</p>
            </div>
          ) : rows.length > 0 ? (
            <CSVPreviewTable rows={rows} />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Empty Selection</p>
            </div>
          )}
        </section>
      </div>

      <div className="w-full border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
        <Footer />
      </div>
    </div>
  )
}


