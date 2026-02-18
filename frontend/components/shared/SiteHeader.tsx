'use client'

import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type SiteHeaderProps = {
  title?: string
  subtitle?: string
  className?: string
  onToggleTheme?: () => void
}

type HeaderProfile = {
  displayName: string
  email: string
  initials: string
  isAdmin: boolean
}

function pickText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function profileFromUser(user: User | null, isAdmin = false): HeaderProfile | null {
  if (!user) {
    return null
  }

  const metadata = user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {}
  const firstName = pickText((metadata as Record<string, unknown>).first_name)
  const lastName = pickText((metadata as Record<string, unknown>).last_name)
  const username = pickText((metadata as Record<string, unknown>).username)
  const email = pickText(user.email)

  const nameFromParts = [firstName, lastName].filter(Boolean).join(' ').trim()
  const displayName = nameFromParts || username || email.split('@')[0] || 'Profile'
  const initialsSource = nameFromParts || username || email || 'P'
  const initials = initialsSource
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return {
    displayName,
    email,
    initials: initials || 'P',
    isAdmin,
  }
}

export default function SiteHeader({
  title = 'JobScan Dashboard',
  subtitle = 'Merged vacancies from JobSearch.az and Glorri',
  className = '',
  onToggleTheme,
}: SiteHeaderProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<HeaderProfile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let isMounted = true
    let latestRequestId = 0

    const applyUser = async (user: User | null) => {
      const requestId = ++latestRequestId

      if (!isMounted) {
        return
      }

      if (!user) {
        setProfile(null)
        setAuthChecked(true)
        setIsProfileMenuOpen(false)
        return
      }

      let isAdmin = false

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle()

        if (!profileError) {
          const profileRecord = profile as { is_admin?: unknown } | null
          isAdmin = profileRecord?.is_admin === true
        }
      } catch {
        isAdmin = false
      }

      if (!isMounted || requestId !== latestRequestId) {
        return
      }

      setProfile(profileFromUser(user, isAdmin))
      setAuthChecked(true)
    }

    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser()
      void applyUser(data.user ?? null)
    }

    loadCurrentUser()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      authSubscription.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      if (!profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isProfileMenuOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsProfileMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const handleToggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme()
      return
    }

    const root = document.documentElement
    const nextTheme = root.classList.contains('dark') ? 'light' : 'dark'
    root.classList.toggle('dark', nextTheme === 'dark')
    root.classList.toggle('light', nextTheme === 'light')
    root.style.colorScheme = nextTheme
    window.localStorage.setItem('theme', nextTheme)
  }

  // Hydration fix: adding a comment to force server-side re-compilation of this component
  return (
    <header className={`border-b border-gray-100/80 pb-3 sm:pb-6 dark:border-gray-800/60 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Modern Stylized Logo */}
        <div className="group relative shrink-0">
          <Link href="/" className="flex items-center gap-2 transition-transform duration-300 active:scale-95 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 transition-transform group-hover:rotate-6 sm:h-11 sm:w-11">
              <svg className="h-5 w-5 text-white sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-gray-900 sm:text-2xl dark:text-white">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Job</span>
                <span>Scan</span>
              </h1>
              <p className="hidden text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 sm:block dark:text-gray-500">
                {subtitle}
              </p>
            </div>
          </Link>
        </div>

        {/* Action Components */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleToggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white/50 text-gray-500 transition-all hover:border-blue-500/30 hover:bg-white hover:text-blue-600 dark:border-gray-700/60 dark:bg-gray-800/40 dark:text-gray-400 dark:hover:border-blue-400/30 dark:hover:bg-gray-800 dark:hover:text-blue-400"
            aria-label="Toggle theme"
          >
            <svg className="hidden h-5 w-5 dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728L5.122 5.122M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <svg className="block h-5 w-5 dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <div className="h-8 w-px bg-gray-100 sm:mx-1 dark:bg-gray-800" />

          {authChecked ? (
            profile ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                  className="flex h-11 items-center gap-3 rounded-2xl border border-gray-200 bg-white/50 px-2.5 pl-3 transition-all hover:border-blue-500/30 hover:bg-white hover:shadow-md dark:border-gray-700/60 dark:bg-gray-800/40 dark:hover:border-blue-400/30 dark:hover:bg-gray-800"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="hidden text-right sm:block">
                    <p className="max-w-[120px] truncate text-xs font-black text-gray-900 dark:text-gray-100">
                      {profile.displayName}
                    </p>
                    <p className="max-w-[120px] truncate text-[10px] font-bold text-gray-400 dark:text-gray-500">
                      {profile.isAdmin ? 'Administrator' : 'Explorer'}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-[11px] font-black text-blue-600 shadow-inner dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-400">
                    {profile.initials}
                  </div>
                </button>

                {isProfileMenuOpen ? (
                  <div
                    className="absolute top-full right-0 z-50 mt-3 w-64 origin-top-right overflow-hidden rounded-[2rem] border border-gray-100 bg-white/95 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900/95"
                    role="menu"
                  >
                    <div className="px-4 py-4 border-b border-gray-50 dark:border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Account</p>
                      <p className="mt-1 truncate text-base font-black text-gray-900 dark:text-white">{profile.displayName}</p>
                      <p className="truncate text-xs font-bold text-gray-400 dark:text-gray-500">{profile.email}</p>
                    </div>

                    <div className="space-y-1 p-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-4 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                        role="menuitem"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        Profile Settings
                      </Link>

                      {profile.isAdmin ? (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-4 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-gray-600 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                          role="menuitem"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </span>
                          Admin Panel
                        </Link>
                      ) : null}
                    </div>

                    <div className="my-1 h-px bg-gray-50 dark:bg-gray-800" />

                    <div className="p-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-4 rounded-2xl px-3.5 py-2.5 text-left text-sm font-bold text-red-500 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        role="menuitem"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="inline-flex h-11 items-center rounded-xl border border-gray-200 bg-white/50 px-5 text-xs font-black uppercase tracking-widest text-gray-700 transition-all hover:bg-white hover:shadow-md dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] hover:shadow-blue-500/40 active:scale-98"
                >
                  Register
                </Link>
              </div>
            )
          ) : (
            <div className="h-11 w-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" aria-hidden />
          )}
        </div>
      </div>
    </header>
  )
}
