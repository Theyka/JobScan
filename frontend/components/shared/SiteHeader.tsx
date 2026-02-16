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
}

function pickText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function profileFromUser(user: User | null): HeaderProfile | null {
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

    const applyUser = (user: User | null) => {
      if (!isMounted) {
        return
      }

      setProfile(profileFromUser(user))
      setAuthChecked(true)
      if (!user) {
        setIsProfileMenuOpen(false)
      }
    }

    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser()
      applyUser(data.user ?? null)
    }

    loadCurrentUser()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null)
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
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-left shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
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
                    className="absolute top-full right-0 z-40 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                    role="menu"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
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
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            <span className="hidden text-xl dark:block">☀️</span>
            <span className="block text-xl dark:hidden">🌙</span>
          </button>
        </div>
      </div>
    </header>
  )
}
