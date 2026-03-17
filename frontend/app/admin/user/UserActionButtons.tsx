'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

import { deleteManagedUserAction, updateManagedUserAdminAction } from '@/app/admin/actions'

type UserActionButtonsProps = {
  userId: string
  isAdmin: boolean
}

type PendingAction = {
  type: 'admin' | 'delete'
  title: string
  message: string
  confirmLabel: string
  tone: 'accent' | 'danger'
}

function ActionIcon({ type }: { type: PendingAction['type'] }) {
  if (type === 'admin') {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 4.75a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5zm0 8.75c-3.88 0-7 2.015-7 4.5v1.25h14V18c0-2.485-3.12-4.5-7-4.5zm7-8.5v4m2-2h-4"
        />
      </svg>
    )
  }

  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M6 7h12m-9 0V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7m-7 0v11a2 2 0 002 2h4a2 2 0 002-2V7M10 11v6m4-6v6"
      />
    </svg>
  )
}

export default function UserActionButtons({ userId, isAdmin }: UserActionButtonsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const approvedActionRef = useRef<PendingAction['type'] | null>(null)
  const adminFormRef = useRef<HTMLFormElement>(null)
  const deleteFormRef = useRef<HTMLFormElement>(null)

  const adminMessage = isAdmin
    ? 'Remove admin access for this account?'
    : 'Give admin access to this account?'

  useEffect(() => {
    if (!pendingAction) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setPendingAction(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pendingAction])

  function openConfirmation(event: FormEvent<HTMLFormElement>, action: PendingAction): void {
    if (approvedActionRef.current === action.type) {
      approvedActionRef.current = null
      return
    }

    event.preventDefault()
    setPendingAction(action)
  }

  function closeConfirmation(): void {
    approvedActionRef.current = null
    setPendingAction(null)
  }

  function confirmPendingAction(): void {
    if (!pendingAction) {
      return
    }

    approvedActionRef.current = pendingAction.type

    const form = pendingAction.type === 'admin' ? adminFormRef.current : deleteFormRef.current
    setPendingAction(null)
    form?.requestSubmit()
  }

  const confirmButtonClass = pendingAction?.tone === 'danger'
    ? 'border border-red-200 bg-red-600 text-white hover:bg-red-700 dark:border-red-500/30 dark:bg-red-500 dark:hover:bg-red-400'
    : 'border border-[#8a6a43]/20 bg-[#8a6a43] text-white hover:bg-[#745634] dark:border-[#d7b37a]/30 dark:bg-[#d7b37a] dark:text-[#111111] dark:hover:bg-[#c9a76f]'

  return (
    <>
      <div className="inline-flex flex-wrap justify-end gap-2">
      <form
        ref={adminFormRef}
        action={updateManagedUserAdminAction}
        className="inline-flex"
        onSubmit={(event) => openConfirmation(event, {
          type: 'admin',
          title: isAdmin ? 'Remove admin access?' : 'Give admin access?',
          message: adminMessage,
          confirmLabel: isAdmin ? 'Remove Access' : 'Give Access',
          tone: isAdmin ? 'danger' : 'accent',
        })}
      >
        <input type="hidden" name="target_user_id" value={userId} />
        <input type="hidden" name="next_is_admin" value={isAdmin ? 'false' : 'true'} />
        <button
          type="submit"
          aria-label={isAdmin ? 'Remove admin access' : 'Make admin'}
          title={isAdmin ? 'Remove admin access' : 'Make admin'}
          className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors ${isAdmin
            ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25'
            : 'border border-[#8a6a43]/20 bg-[#f8f6f3] text-[#8a6a43] hover:bg-white dark:border-[#d7b37a]/25 dark:bg-white/6 dark:text-[#d7b37a] dark:hover:bg-white/10'
            }`}
        >
          {isAdmin ? (
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M18 12H6" />
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
        action={deleteManagedUserAction}
        className="inline-flex"
        onSubmit={(event) => openConfirmation(event, {
          type: 'delete',
          title: 'Delete account?',
          message: 'Delete this account permanently? This action cannot be undone.',
          confirmLabel: 'Delete Account',
          tone: 'danger',
        })}
      >
        <input type="hidden" name="target_user_id" value={userId} />
        <button
          type="submit"
          aria-label="Delete user"
          title="Delete user"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 7h12m-9 0V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7m-7 0v11a2 2 0 002 2h4a2 2 0 002-2V7M10 11v6m4-6v6" />
          </svg>
        </button>
      </form>
      </div>

      {pendingAction ? (
        <div className="fixed inset-0 z-130 flex items-center justify-center bg-[#111111]/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-user-confirm-title">
          <button
            type="button"
            aria-label="Close confirmation dialog"
            className="absolute inset-0 cursor-default"
            onClick={closeConfirmation}
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/8 bg-[#fcfbfa] p-6 text-left shadow-[0_24px_80px_rgba(17,17,17,0.16)] dark:border-white/10 dark:bg-[#151515] sm:p-7">
            <div className="flex items-start gap-4">
              <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${pendingAction.tone === 'danger'
                ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                : 'bg-[#f3ede4] text-[#8a6a43] dark:bg-[#d7b37a]/15 dark:text-[#d7b37a]'
                }`}>
                <ActionIcon type={pendingAction.type} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 id="admin-user-confirm-title" className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {pendingAction.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                  {pendingAction.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeConfirmation}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-black/8 bg-white px-5 text-sm font-black tracking-wide text-slate-700 transition-colors hover:bg-[#f8f6f3] dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPendingAction}
                className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-black tracking-wide transition-colors ${confirmButtonClass}`}
              >
                {pendingAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
