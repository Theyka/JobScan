'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import Footer from '@/components/shared/Footer'
import SiteHeader from '@/components/shared/SiteHeader'
import { INITIAL_AUTH_ACTION_STATE } from '@/lib/datatypes/auth.types'

import { registerAction } from './actions'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, INITIAL_AUTH_ACTION_STATE)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 transition-colors duration-300 dark:bg-[#111111]">
      {/* Sticky Header Wrapper */}
      <div className="sticky top-0 z-120 w-full border-b border-slate-200/80 bg-white/92 backdrop-blur-xl supports-backdrop-filter:bg-white/78 dark:border-white/8 dark:bg-[#151515] dark:supports-backdrop-filter:bg-[#151515]/92">
        <div className="mx-auto w-full max-w-7xl px-4">
          <SiteHeader
            className="border-none pb-2! sm:pb-4! pt-3! sm:pt-4!"
          />
        </div>
      </div>

      <main className="grow">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-16 sm:py-20">
          <div className="w-full max-w-2xl">
            {/* Register Card */}
            <section className="relative overflow-hidden rounded-2xl border border-black/8 bg-[#fcfbfa] p-8 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] sm:p-12">
              <div className="relative z-10">
                <div className="mb-10 text-center">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Create Account</h1>
                  <p className="mt-2 text-sm font-semibold text-slate-400 dark:text-slate-500">
                    Join JobScan to discover the best opportunities
                  </p>
                </div>

                {state.status !== 'idle' ? (
                  <div className={`mb-8 flex items-center gap-3 rounded-lg border p-4 text-sm font-bold ${state.status === 'success'
                    ? 'border-green-100 bg-green-50/50 text-green-600 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400'
                    : 'border-red-100 bg-red-50/50 text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'
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

                <form action={formAction} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="first_name" className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        First Name
                      </label>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        autoComplete="given-name"
                        required
                        placeholder="John"
                        className="h-12 w-full rounded-lg border border-black/8 bg-white px-5 text-sm font-bold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 dark:border-white/8 dark:bg-white/6 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-400 sm:h-14"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="last_name" className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Last Name
                      </label>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        autoComplete="family-name"
                        required
                        placeholder="Doe"
                        className="h-12 w-full rounded-lg border border-black/8 bg-white px-5 text-sm font-bold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 dark:border-white/8 dark:bg-white/6 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-400 sm:h-14"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="username" className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="johndoe"
                      className="h-14 w-full rounded-lg border border-black/8 bg-white px-5 text-sm font-bold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 dark:border-white/8 dark:bg-white/6 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@example.com"
                      className="h-14 w-full rounded-lg border border-black/8 bg-white px-5 text-sm font-bold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 dark:border-white/8 dark:bg-white/6 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
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
                      className="h-14 w-full rounded-lg border border-black/8 bg-white px-5 text-sm font-bold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 dark:border-white/8 dark:bg-white/6 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="group relative h-12 w-full overflow-hidden rounded-lg border border-indigo-600 bg-indigo-600 font-black uppercase tracking-widest text-white transition-colors hover:border-indigo-700 hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:h-14"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isPending ? 'Creating Account...' : (
                        <>
                          Create My Account
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <div className="mt-10 text-center">
                  <p className="text-xs font-bold text-slate-500">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="ml-1 text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Login instead
                    </Link>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

