'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { INITIAL_AUTH_ACTION_STATE } from '@/lib/datatypes/auth.types'

import { registerAction } from './actions'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, INITIAL_AUTH_ACTION_STATE)

  return (
    <main className="relative mx-auto flex w-full max-w-345 grow flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-3xl py-6 lg:py-10">
          <section className="rounded-3xl border border-black/8 bg-[#fcfbfa] p-6 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] sm:p-8 lg:p-10">
            <div className="mb-8">
              <p className="corporate-kicker">Registration</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#161616] dark:text-white">
                Build your account
              </h2>
              <p className="mt-2 text-sm text-black/56 dark:text-white/50">
                Complete the details below to create your JobScan identity.
              </p>
            </div>

            {state.status !== 'idle' ? (
              <div className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${state.status === 'success'
                ? 'border-green-200/70 bg-green-50/80 text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-300'
                : 'border-red-200/70 bg-red-50/80 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300'
                }`}>
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {state.status === 'success' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                {state.message}
              </div>
            ) : null}

            <form action={formAction} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="ml-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/46 dark:text-white/44">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    autoComplete="given-name"
                    required
                    placeholder="John"
                    className="h-13 w-full rounded-xl border border-black/8 bg-[#f8f6f3] px-4 text-sm font-medium text-[#161616] outline-none placeholder:text-black/32 focus:border-[#8a6a43] dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#d7b37a]"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="last_name" className="ml-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/46 dark:text-white/44">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    autoComplete="family-name"
                    required
                    placeholder="Doe"
                    className="h-13 w-full rounded-xl border border-black/8 bg-[#f8f6f3] px-4 text-sm font-medium text-[#161616] outline-none placeholder:text-black/32 focus:border-[#8a6a43] dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#d7b37a]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="ml-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/46 dark:text-white/44">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="johndoe"
                  className="h-13 w-full rounded-xl border border-black/8 bg-[#f8f6f3] px-4 text-sm font-medium text-[#161616] outline-none placeholder:text-black/32 focus:border-[#8a6a43] dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#d7b37a]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="ml-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/46 dark:text-white/44">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  className="h-13 w-full rounded-xl border border-black/8 bg-[#f8f6f3] px-4 text-sm font-medium text-[#161616] outline-none placeholder:text-black/32 focus:border-[#8a6a43] dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#d7b37a]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="ml-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/46 dark:text-white/44">
                  Secure Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="h-13 w-full rounded-xl border border-black/8 bg-[#f8f6f3] px-4 text-sm font-medium text-[#161616] outline-none placeholder:text-black/32 focus:border-[#8a6a43] dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#d7b37a]"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-13 w-full items-center justify-center rounded-xl border border-[#151515] bg-[#151515] px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:border-[#8a6a43] hover:bg-[#8a6a43] disabled:cursor-not-allowed disabled:opacity-70 dark:border-white dark:bg-white dark:text-[#151515] dark:hover:border-[#d7b37a] dark:hover:bg-[#d7b37a]"
              >
                {isPending ? 'Creating account...' : 'Create my account'}
              </button>
            </form>

            <div className="mt-8 border-t border-black/8 pt-6 text-sm text-black/56 dark:border-white/8 dark:text-white/54">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-[#8a6a43] transition-colors hover:text-[#6f5231] dark:text-[#d7b37a] dark:hover:text-[#e7c995]">
                Login instead
              </Link>
            </div>
          </section>
        </section>
    </main>
  )
}

