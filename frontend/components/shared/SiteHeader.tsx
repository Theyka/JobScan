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

  return (
    <header className={`border-b border-gray-200 pb-6 dark:border-gray-700 ${className}`}>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/" className="text-2xl font-bold text-gray-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-300">
            {title}
          </Link>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>

        <div className="mt-2 flex flex-row items-center gap-3 sm:mt-0 sm:w-auto sm:justify-end">
          {authChecked ? (
            profile ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                  className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 text-left shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {profile.initials}
                  </span>
                  <div className="hidden sm:block">
                    <p className="max-w-40 truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {profile.displayName}
                    </p>
                    <p className="max-w-40 truncate text-xs text-gray-500 dark:text-gray-400">{profile.email}</p>
                  </div>
                </button>

                {isProfileMenuOpen ? (
                  <div
                    className="absolute top-full right-0 z-50 mt-3 w-56 origin-top-right rounded-2xl border border-gray-200 bg-white p-2 shadow-xl ring-1 ring-black/5 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                    role="menu"
                  >
                    <div className="mb-2 px-3 py-2.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Account</p>
                      <p className="mt-1 truncate text-sm font-bold text-gray-900 dark:text-white">{profile.displayName}</p>
                      <p className="truncate text-[10px] font-medium text-gray-500 dark:text-gray-400">{profile.email}</p>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-gray-700/50" />

                    <div className="mt-1.5 space-y-0.5">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-slate-50 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-gray-700/50 dark:hover:text-blue-400"
                        role="menuitem"
                      >
                        <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile Settings
                      </Link>

                      {profile.isAdmin ? (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-slate-50 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-gray-700/50 dark:hover:text-blue-400"
                          role="menuitem"
                        >
                          <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Admin Panel
                        </Link>
                      ) : null}
                    </div>

                    <div className="my-1.5 h-px bg-gray-100 dark:bg-gray-700/50" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      role="menuitem"
                    >
                      <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="inline-flex h-11 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex h-11 items-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )
          ) : (
            <div className="h-9 w-36" aria-hidden />
          )}

          <button
            type="button"
            onClick={handleToggleTheme}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-xl leading-none text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            <span className="hidden dark:block">☀️</span>
            <span className="block dark:hidden">🌙</span>
          </button>
        </div>
      </div>
    </header>
  )
}
