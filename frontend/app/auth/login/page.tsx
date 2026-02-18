'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import Footer from '@/components/shared/Footer'
import SiteHeader from '@/components/shared/SiteHeader'
import { INITIAL_AUTH_ACTION_STATE } from '@/lib/datatypes/auth.types'

import { loginAction } from './actions'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, INITIAL_AUTH_ACTION_STATE)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      {/* Sticky Header Wrapper */}
      <div className="relative z-[100] sm:sticky top-0 w-full shadow-sm">
        <div className="absolute inset-0 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-[#0f172a]/80" />
        <div className="relative container mx-auto max-w-7xl px-4">
          <SiteHeader
            className="border-none !pb-2 sm:!pb-4 !pt-3 sm:!pt-4"
          />
        </div>
      </div>


      <main className="flex-grow">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-16 sm:py-24">
          <div className="w-full max-w-md">
            {/* Login Card */}
            <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-300/50 bg-white p-8 shadow-2xl shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900/40 sm:p-10">
              <div className="relative z-10">
                <div className="mb-8">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Welcome Back</h1>
                  <p className="mt-2 text-sm font-semibold text-slate-400 dark:text-slate-500">
                    Login to access your personalized job board
                  </p>
                </div>

                {state.status === 'error' ? (
                  <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-4 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {state.message}
                  </div>
                ) : null}

                <form action={formAction} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-indigo-500">
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
                        className="h-12 sm:h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-400 dark:focus:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-indigo-500">
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
                        className="h-12 sm:h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-400 dark:focus:bg-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="group relative h-12 sm:h-14 w-full overflow-hidden rounded-2xl bg-indigo-600 font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-700/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isPending ? 'Authenticating...' : (
                        <>
                          Login to Account
                          <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-xs font-bold text-slate-500">
                    New to JobScan?{' '}
                    <Link href="/auth/register" className="ml-1 text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Create an account
                    </Link>
                  </p>
                </div>
              </div>

              {/* Decorative Blur Elements */}
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/5 blur-[100px]" />
              <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/5 blur-[100px]" />
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

