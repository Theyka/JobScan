'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import LandingTopBar from '@/components/landing/LandingTopBar'
import Footer from '@/components/shared/Footer'
import { INITIAL_AUTH_ACTION_STATE } from '@/lib/datatypes/auth.types'

import { loginAction } from './actions'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, INITIAL_AUTH_ACTION_STATE)

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-[#111111] dark:text-white">
      <div className="sticky top-0 z-120 w-full border-b border-black/20 bg-[#151515]">
        <div className="mx-auto max-w-345 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <LandingTopBar />
        </div>
      </div>

      <main className="relative mx-auto flex w-full max-w-345 grow flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-2xl py-6 lg:py-10">
          <section className="rounded-3xl border border-black/8 bg-[#fcfbfa] p-6 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] sm:p-8 lg:p-10">
            <div className="mb-8">
              <p className="corporate-kicker">Login</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#161616] dark:text-white">
                Access your account
              </h2>
              <p className="mt-2 text-sm text-black/56 dark:text-white/50">
                Use your email and password to enter your JobScan workspace.
              </p>
            </div>

            {state.status === 'error' ? (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {state.message}
              </div>
            ) : null}

            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="ml-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/46 dark:text-white/44">
                  Email Address
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-black/34 transition-colors group-focus-within:text-[#8a6a43] dark:text-white/34 dark:group-focus-within:text-[#d7b37a]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@example.com"
                    className="h-13 w-full rounded-xl border border-black/8 bg-[#f8f6f3] pl-12 pr-4 text-sm font-medium text-[#161616] outline-none placeholder:text-black/32 focus:border-[#8a6a43] dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#d7b37a]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="ml-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/46 dark:text-white/44">
                  Password
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-black/34 transition-colors group-focus-within:text-[#8a6a43] dark:text-white/34 dark:group-focus-within:text-[#d7b37a]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="h-13 w-full rounded-xl border border-black/8 bg-[#f8f6f3] pl-12 pr-4 text-sm font-medium text-[#161616] outline-none placeholder:text-black/32 focus:border-[#8a6a43] dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#d7b37a]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-13 w-full items-center justify-center rounded-xl border border-[#151515] bg-[#151515] px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:border-[#8a6a43] hover:bg-[#8a6a43] disabled:cursor-not-allowed disabled:opacity-70 dark:border-white dark:bg-white dark:text-[#151515] dark:hover:border-[#d7b37a] dark:hover:bg-[#d7b37a]"
              >
                {isPending ? 'Authenticating...' : 'Login to account'}
              </button>
            </form>

            <div className="mt-8 border-t border-black/8 pt-6 text-sm text-black/56 dark:border-white/8 dark:text-white/54">
              New to JobScan?{' '}
              <Link href="/auth/register" className="font-semibold text-[#8a6a43] transition-colors hover:text-[#6f5231] dark:text-[#d7b37a] dark:hover:text-[#e7c995]">
                Create an account
              </Link>
            </div>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  )
}

