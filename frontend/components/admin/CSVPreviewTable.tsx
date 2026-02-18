'use client'

import { useState, useCallback, useEffect } from 'react'

interface CSVPreviewTableProps {
    rows: any[]
}

const HEADERS = [
    { label: 'Source', field: 'source' },
    { label: 'ID', field: 'vacancy_id' },
    { label: 'Views', field: 'views_count' },
    { label: 'Title', field: 'title' },
    { label: 'Company', field: 'company' },
    { label: 'Slug', field: 'slug' },
    { label: 'Posted', field: 'posted_date' },
    { label: 'Created', field: 'created_at' },
    { label: 'Deadline', field: 'deadline_at' },
    { label: 'Location', field: 'location' },
    { label: 'Type', field: 'type' },
    { label: 'Function', field: 'job_function' },
    { label: 'Level', field: 'career_level' },
    { label: 'Salary', field: 'salary' },
    { label: 'Detail URL', field: 'detail_url' },
    { label: 'Apply URL', field: 'apply_url' },
    { label: 'Stack', field: 'tech_stack' },
    { label: 'Text', field: 'text' },
    { label: 'About', field: 'vacancy_about' },
    { label: 'Benefits', field: 'benefits' },
]

export default function CSVPreviewTable({ rows }: CSVPreviewTableProps) {
    const [selectedRow, setSelectedRow] = useState<any | null>(null)

    const handleRowDoubleClick = useCallback((row: any) => {
        setSelectedRow(row)
    }, [])

    const closeOverlay = useCallback(() => {
        setSelectedRow(null)
    }, [])

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeOverlay()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [closeOverlay])

    return (
        <div className="group relative">
            <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="bg-slate-50/80 backdrop-blur-sm dark:bg-slate-800/40">
                            <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50/90 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-700/50 dark:bg-slate-800/90 dark:text-slate-500">
                                #
                            </th>
                            {HEADERS.map((h) => (
                                <th key={h.field} className="border-b border-slate-200 px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-700/50 dark:text-slate-500 whitespace-nowrap">
                                    {h.label}
                                </th>
                            ))}

                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                        {rows.map((item, index) => (
                            <tr
                                key={`${item.source}-${item.vacancy_id}`}
                                onDoubleClick={() => handleRowDoubleClick(item)}
                                className="group cursor-pointer transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                            >
                                <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-4 dark:border-slate-700/50 dark:bg-slate-900 group-hover:bg-slate-50/90 dark:group-hover:bg-slate-800/90">
                                    <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                        {index + 1}
                                    </span>
                                </td>
                                {HEADERS.map((h) => (
                                    <td key={h.field} className="px-4 sm:px-6 py-4">
                                        <div className="max-w-[15rem] sm:max-w-[20rem] truncate font-mono text-[11px] font-medium text-slate-600 dark:text-slate-300" title={item[h.field]}>
                                            {item[h.field] || '-'}
                                        </div>
                                    </td>
                                ))}

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail Overlay */}
            {selectedRow && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={closeOverlay}
                    />

                    <div className="relative z-[110] flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 dark:border-slate-800/60">
                            <div>
                                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Row Inspection</h3>
                                <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">Complete data dump for this entry</p>
                            </div>
                            <button
                                onClick={closeOverlay}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content Container */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                                {/* Basic Metadata */}
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        {HEADERS.slice(0, 14).map((h) => (
                                            <div key={h.field} className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                    {h.label}
                                                </label>
                                                <p className="font-mono text-sm font-bold text-slate-900 dark:text-white break-all">
                                                    {selectedRow[h.field] || '-'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-6">
                                        {HEADERS.slice(14, 16).map((h) => (
                                            <div key={h.field} className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                    {h.label}
                                                </label>
                                                <a
                                                    href={selectedRow[h.field]}
                                                    target="_blank"
                                                    className="block font-mono text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 break-all"
                                                >
                                                    {selectedRow[h.field] || '-'}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rich Content & Stack */}
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                            Tech Stack
                                        </label>
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 font-mono text-xs font-bold text-indigo-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-indigo-400">
                                            {selectedRow.tech_stack || '{}'}
                                        </div>
                                    </div>

                                    {HEADERS.slice(17).map((h) => (
                                        <div key={h.field} className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                {h.label}
                                            </label>
                                            <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-sm font-semibold leading-relaxed text-slate-700 custom-scrollbar dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-300">
                                                {selectedRow[h.field] || 'No content provided'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-4 dark:border-slate-800/60 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Database Index: {selectedRow.vacancy_id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hint Overlay for Horizontal Scrolling */}
            {!selectedRow && (
                <>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/40 to-transparent dark:from-[#020617] dark:via-[#020617]/40" />
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm transition-opacity group-hover:opacity-100 opacity-0 dark:bg-slate-800 dark:border-slate-700">
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </>
            )}

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
        </div>
    )
}
