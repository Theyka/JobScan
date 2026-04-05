'use client'

import type { User } from '@supabase/supabase-js'
import { BriefcaseBusiness } from 'lucide-react'
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

function ThemeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-(--line) bg-(--surface-strong) text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] hover:border-(--accent) hover:text-(--accent)"
      aria-label="Toggle theme"
    >
      <svg className="hidden h-5 w-5 dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <svg className="block h-5 w-5 dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
  )
}

export default function SiteHeader({
  title = `${process.env.NEXT_PUBLIC_SITE_NAME} Intelligence`,
  subtitle = 'Corporate-grade monitoring of Azerbaijan technology hiring',
  className = '',
  onToggleTheme,
}: SiteHeaderProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<HeaderProfile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)

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
        setIsMobileMenuOpen(false)
        return
      }

      let isAdmin = false

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle()

        if (!profileError) {
          const profileRecord = profileData as { is_admin?: unknown } | null
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

    void loadCurrentUser()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      authSubscription.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!isProfileMenuOpen && !isMobileMenuOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      if (isProfileMenuOpen && !profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false)
      }

      if (isMobileMenuOpen && !mobileMenuRef.current?.contains(target)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isProfileMenuOpen, isMobileMenuOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsProfileMenuOpen(false)
    setIsMobileMenuOpen(false)
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

  const authArea = authChecked ? (
    profile ? (
      <div ref={profileMenuRef} className="relative">
        <button
          type="button"
          onClick={() => setIsProfileMenuOpen((open) => !open)}
          className="flex h-11 items-center gap-3 rounded-lg border border-(--line) bg-(--surface-strong) px-2.5 pl-3 text-left hover:border-(--accent)"
          aria-expanded={isProfileMenuOpen}
          aria-haspopup="menu"
        >
          <div className="hidden min-w-0 sm:block">
            <p className="max-w-35 truncate text-sm font-semibold text-foreground">
              {profile.displayName}
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--foreground)_44%,transparent)]">
              {profile.isAdmin ? 'Administrator' : 'Workspace'}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--accent) text-[11px] font-semibold text-white">
            {profile.initials}
          </div>
        </button>

        {isProfileMenuOpen ? (
          <div
            className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-xl border border-(--line) bg-(--surface-strong) p-2 backdrop-blur-xl"
            role="menu"
          >
            <div className="border-b border-(--line) px-4 py-4">
              <p className="corporate-kicker">Account</p>
              <p className="mt-2 truncate text-base font-semibold text-foreground">{profile.displayName}</p>
              <p className="truncate text-sm text-[color-mix(in_srgb,var(--foreground)_56%,transparent)]">
                {profile.email}
              </p>
            </div>

            <div className="space-y-1 p-1">
              <Link
                href="/profile"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-4 rounded-lg px-3.5 py-3 text-sm font-semibold text-[color-mix(in_srgb,var(--foreground)_74%,transparent)] hover:bg-(--accent-soft) hover:text-(--accent)"
                role="menuitem"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--surface-muted)">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                Profile settings
              </Link>

              {profile.isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-lg px-3.5 py-3 text-sm font-semibold text-[color-mix(in_srgb,var(--foreground)_74%,transparent)] hover:bg-(--accent-soft) hover:text-(--accent)"
                  role="menuitem"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--surface-muted)">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                  Admin panel
                </Link>
              ) : null}
            </div>

            <div className="my-1 h-px bg-(--line)" />

            <div className="p-1">
              <button
                type="button"
                onClick={handleLogout}
                className="group flex w-full items-center gap-4 rounded-lg px-3.5 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                role="menuitem"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 transition group-hover:bg-red-100 dark:bg-red-950/40 dark:group-hover:bg-red-950/70">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                Sign out
              </button>
            </div>
          </div>
        ) : null}
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="inline-flex h-11 items-center rounded-lg border border-(--line) bg-(--surface-strong) px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--foreground)_76%,transparent)]"
        >
          Sign in
        </Link>
        <Link
          href="/auth/register"
          className="inline-flex h-11 items-center rounded-lg bg-(--accent) px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-(--accent-strong)"
        >
          Create account
        </Link>
      </div>
    )
  ) : (
    <div className="h-11 w-40 animate-pulse rounded-full bg-(--surface-muted)" aria-hidden />
  )

  return (
    <header className={className}>
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-(--accent) text-white">
            <BriefcaseBusiness className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--foreground)_44%,transparent)]">
              {title}
            </p>
            <h1 className="truncate text-lg font-semibold tracking-[-0.04em] text-foreground sm:text-xl">
              {process.env.NEXT_PUBLIC_SITE_NAME}
            </h1>
            <p className="hidden truncate text-xs text-[color-mix(in_srgb,var(--foreground)_56%,transparent)] sm:block">
              {subtitle}
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-3 sm:flex">
          <ThemeButton onClick={handleToggleTheme} />
          {authArea}
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <ThemeButton onClick={handleToggleTheme} />

          <div ref={mobileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-(--line) bg-(--surface-strong) text-foreground"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 7h16M4 12h16m-10 5h10" />
                </svg>
              )}
            </button>

            {isMobileMenuOpen ? (
              <div
                className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-xl border border-(--line) bg-(--surface-strong) p-2 backdrop-blur-xl"
                role="menu"
              >
                {authChecked ? (
                  profile ? (
                    <>
                      <div className="border-b border-(--line) px-4 py-4">
                        <p className="corporate-kicker">Account</p>
                        <p className="mt-2 truncate text-base font-semibold text-foreground">
                          {profile.displayName}
                        </p>
                        <p className="truncate text-sm text-[color-mix(in_srgb,var(--foreground)_56%,transparent)]">
                          {profile.email}
                        </p>
                      </div>

                      <div className="space-y-1 p-1">
                        <Link
                          href="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-4 rounded-lg px-3.5 py-3 text-sm font-semibold text-[color-mix(in_srgb,var(--foreground)_74%,transparent)] hover:bg-(--accent-soft) hover:text-(--accent)"
                          role="menuitem"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--surface-muted)">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </span>
                          Profile settings
                        </Link>

                        {profile.isAdmin ? (
                          <Link
                            href="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 rounded-lg px-3.5 py-3 text-sm font-semibold text-[color-mix(in_srgb,var(--foreground)_74%,transparent)] hover:bg-(--accent-soft) hover:text-(--accent)"
                            role="menuitem"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--surface-muted)">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </span>
                            Admin panel
                          </Link>
                        ) : null}
                      </div>

                      <div className="my-1 h-px bg-(--line)" />

                      <div className="p-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="group flex w-full items-center gap-4 rounded-lg px-3.5 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                          role="menuitem"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 transition group-hover:bg-red-100 dark:bg-red-950/40 dark:group-hover:bg-red-950/70">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </span>
                          Sign out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1 p-1">
                      <Link
                        href="/auth/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 rounded-lg px-3.5 py-3 text-sm font-semibold text-[color-mix(in_srgb,var(--foreground)_74%,transparent)] hover:bg-(--accent-soft) hover:text-(--accent)"
                        role="menuitem"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--surface-muted)">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </span>
                        Sign in
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 rounded-lg px-3.5 py-3 text-sm font-semibold text-(--accent) hover:bg-(--accent-soft)"
                        role="menuitem"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--accent-soft)">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </span>
                        Create account
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="p-4">
                    <div className="h-11 w-full animate-pulse rounded-full bg-(--surface-muted)" />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
