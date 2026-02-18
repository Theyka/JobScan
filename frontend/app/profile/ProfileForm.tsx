'use client'

import { useActionState } from 'react'

import { INITIAL_PROFILE_ACTION_STATE } from '@/lib/datatypes/profile.types'

import { updateProfileAction } from './actions'

type ProfileFormProps = {
  email: string
  initialFirstName: string
  initialLastName: string
  initialUsername: string
}

export default function ProfileForm({
  email,
  initialFirstName,
  initialLastName,
  initialUsername,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, INITIAL_PROFILE_ACTION_STATE)

  return (
    <section className="mx-auto w-full max-w-xl rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Profile Settings</h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Manage your personal identity across the platform</p>
      </div>

      {state.status !== 'idle' ? (
        <div
          className={`mb-8 flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold shadow-sm transition-all ${state.status === 'success'
            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400'
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'
            }`}
        >
          {state.status === 'success' ? (
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="email" className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Registered Email
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                className="w-full h-12 cursor-not-allowed rounded-xl border border-slate-100 bg-slate-50 pl-11 pr-4 text-xs font-bold text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="first_name" className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              First name
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              defaultValue={initialFirstName}
              required
              placeholder="e.g. Abutalıb"
              className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition-all placeholder-slate-400 focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label htmlFor="last_name" className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Last name
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              defaultValue={initialLastName}
              required
              placeholder="e.g. Şiriyev"
              className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition-all placeholder-slate-400 focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-500/50"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="username" className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Public Username
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                id="username"
                name="username"
                type="text"
                defaultValue={initialUsername}
                required
                placeholder="e.g. abutalib"
                className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition-all placeholder-slate-400 focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-500/50"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-indigo-600 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Save Identity
            </>
          )}
        </button>
      </form>
    </section>
  )
}
