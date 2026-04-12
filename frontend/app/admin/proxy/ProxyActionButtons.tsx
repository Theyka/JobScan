'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

import { deleteProxyAction, toggleProxyAction } from '@/app/admin/proxy/actions'

type Props = {
  proxyId: number
  isActive: boolean
}

type PendingAction = {
  type: 'toggle' | 'delete'
  title: string
  message: string
  confirmLabel: string
  tone: 'accent' | 'danger'
}

export default function ProxyActionButtons({ proxyId, isActive }: Props) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const approvedRef = useRef<PendingAction['type'] | null>(null)
  const toggleFormRef = useRef<HTMLFormElement>(null)
  const deleteFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!pendingAction) return undefined

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setPendingAction(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pendingAction])

  function openConfirmation(e: FormEvent<HTMLFormElement>, action: PendingAction) {
    if (approvedRef.current === action.type) {
      approvedRef.current = null
      return
    }
    e.preventDefault()
    setPendingAction(action)
  }

  function closeConfirmation() {
    approvedRef.current = null
    setPendingAction(null)
  }

  function confirmPendingAction() {
    if (!pendingAction) return
    approvedRef.current = pendingAction.type
    const form = pendingAction.type === 'toggle' ? toggleFormRef.current : deleteFormRef.current
    setPendingAction(null)
    form?.requestSubmit()
  }

  const confirmClass =
    pendingAction?.tone === 'danger'
      ? 'border border-red-200 bg-red-600 text-white hover:bg-red-700 dark:border-red-500/30 dark:bg-red-500 dark:hover:bg-red-400'
      : 'border border-[#8a6a43]/20 bg-[#8a6a43] text-white hover:bg-[#745634] dark:border-[#d7b37a]/30 dark:bg-[#d7b37a] dark:text-[#111111] dark:hover:bg-[#c9a76f]'

  return (
    <>
      <div className="inline-flex flex-wrap justify-end gap-2">
        <form
          ref={toggleFormRef}
          action={toggleProxyAction}
          className="inline-flex"
          onSubmit={(e) =>
            openConfirmation(e, {
              type: 'toggle',
              title: isActive ? 'Disable proxy?' : 'Enable proxy?',
              message: isActive
                ? 'This proxy will no longer be used for translation requests.'
                : 'This proxy will be used again for translation requests.',
              confirmLabel: isActive ? 'Disable' : 'Enable',
              tone: isActive ? 'danger' : 'accent',
            })
          }
        >
          <input type="hidden" name="proxy_id" value={proxyId} />
          <input type="hidden" name="next_is_active" value={isActive ? 'false' : 'true'} />
          <button
            type="submit"
            aria-label={isActive ? 'Disable proxy' : 'Enable proxy'}
            title={isActive ? 'Disable proxy' : 'Enable proxy'}
            className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors ${
              isActive
                ? 'border border-[#8a6a43]/20 bg-[#f8f6f3] text-[#8a6a43] hover:bg-white dark:border-[#d7b37a]/25 dark:bg-white/6 dark:text-[#d7b37a] dark:hover:bg-white/10'
                : 'border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-white/4 dark:text-slate-500 dark:hover:bg-white/8'
            }`}
          >
            {isActive ? (
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 12h14" />
              </svg>
            ) : (
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 5v14m7-7H5" />
              </svg>
            )}
          </button>
        </form>

        <form
          ref={deleteFormRef}
          action={deleteProxyAction}
          className="inline-flex"
          onSubmit={(e) =>
            openConfirmation(e, {
              type: 'delete',
              title: 'Delete proxy?',
              message: 'Remove this proxy permanently? This cannot be undone.',
              confirmLabel: 'Delete Proxy',
              tone: 'danger',
            })
          }
        >
          <input type="hidden" name="proxy_id" value={proxyId} />
          <button
            type="submit"
            aria-label="Delete proxy"
            title="Delete proxy"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25"
          >
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M6 7h12m-9 0V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7m-7 0v11a2 2 0 002 2h4a2 2 0 002-2V7M10 11v6m4-6v6"
              />
            </svg>
          </button>
        </form>
      </div>

      {pendingAction && (
        <div
          className="fixed inset-0 z-130 flex items-center justify-center bg-[#111111]/55 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="proxy-confirm-title"
        >
          <button
            type="button"
            aria-label="Close confirmation dialog"
            className="absolute inset-0 cursor-default"
            onClick={closeConfirmation}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/8 bg-[#fcfbfa] p-6 text-left shadow-[0_24px_80px_rgba(17,17,17,0.16)] dark:border-white/10 dark:bg-[#151515] sm:p-7">
            <div className="flex items-start gap-4">
              <div
                className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  pendingAction.tone === 'danger'
                    ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                    : 'bg-[#f8f6f3] text-[#8a6a43] dark:bg-white/6 dark:text-[#d7b37a]'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 id="proxy-confirm-title" className="text-base font-black text-slate-900 dark:text-white">
                  {pendingAction.title}
                </h3>
                <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">{pendingAction.message}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirmation}
                className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-black/8 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/8 dark:bg-white/6 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPendingAction}
                className={`inline-flex h-10 cursor-pointer items-center rounded-xl px-5 text-sm font-bold transition-colors ${confirmClass}`}
              >
                {pendingAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
