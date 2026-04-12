'use client'

import type { User } from '@supabase/supabase-js'
import { BriefcaseBusiness } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import NotificationBell from '@/components/shared/NotificationBell'
import { applyTheme, persistTheme } from '@/lib/theme'
import { createClient } from '@/lib/supabase/client'

type LandingTopBarProps = {
  onToggleTheme?: () => void
}

type HeaderProfile = {
  displayName: string
  initials: string
  isAdmin: boolean
  userId: string
}

function pickText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function buildProfile(user: User | null, isAdmin = false): HeaderProfile | null {
  if (!user) {
    return null
  }

  const metadata = user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {}
  const firstName = pickText((metadata as Record<string, unknown>).first_name)
  const lastName = pickText((metadata as Record<string, unknown>).last_name)
  const username = pickText((metadata as Record<string, unknown>).username)
  const email = pickText(user.email)

  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || username || email.split('@')[0] || 'Profile'
  const initials = (displayName || 'P')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return {
    displayName,
    initials: initials || 'P',
    isAdmin,
    userId: user.id,
  }
}

function CircleButton({
  onClick,
  children,
  label,
}: {
  onClick?: () => void
  children: React.ReactNode
  label: string
}) {
  const contentClassName = 'flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/72 transition hover:border-white/20 hover:bg-white/10 hover:text-white'

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={contentClassName} aria-label={label}>
        {children}
      </button>
    )
  }

  return (
    <span className={contentClassName} aria-hidden>
      {children}
    </span>
  )
}

export default function LandingTopBar({ onToggleTheme }: LandingTopBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<HeaderProfile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user ?? null

      if (!user) {
        if (isMounted) {
          setProfile(null)
          setAuthChecked(true)
        }
        return
      }

      let isAdmin = false

      try {
        const { data: profileData } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
        isAdmin = profileData?.is_admin === true
      } catch {
        isAdmin = false
      }

      if (isMounted) {
        setProfile(buildProfile(user, isAdmin))
        setAuthChecked(true)
      }
    }

    void loadUser()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setProfile(buildProfile(session?.user ?? null, profile?.isAdmin ?? false))
      setAuthChecked(true)
    })

    return () => {
      isMounted = false
      authSubscription.subscription.unsubscribe()
    }
  }, [profile?.isAdmin, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
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
    applyTheme(nextTheme)
    persistTheme(nextTheme)
  }

  return (
    <header className="text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#151515]">
            <BriefcaseBusiness className="h-5.5 w-5.5" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-[-0.03em] text-white">{process.env.NEXT_PUBLIC_SITE_NAME}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <Link href="/" className={`text-sm font-medium transition ${pathname === '/' ? 'text-white hover:text-white/82' : 'text-white/70 hover:text-white'}`}>
            Home
          </Link>
          <Link href="/companies" className={`text-sm font-medium transition ${pathname === '/companies' || pathname?.startsWith('/companies/') ? 'text-white hover:text-white/82' : 'text-white/70 hover:text-white'}`}>
            Companies
          </Link>
          {profile ? (
            <Link href="/my-stack" className={`text-sm font-medium transition ${pathname === '/my-stack' || pathname?.startsWith('/my-stack/') ? 'text-white hover:text-white/82' : 'text-white/70 hover:text-white'}`}>
              My Stack
            </Link>
          ) : null}
          {profile?.isAdmin ? (
            <Link href="/admin" className={`text-sm font-medium transition ${pathname === '/admin' || pathname?.startsWith('/admin/') ? 'text-white hover:text-white/82' : 'text-white/70 hover:text-white'}`}>
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <CircleButton onClick={handleToggleTheme} label="Toggle theme">
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </CircleButton>

          {profile ? <NotificationBell userId={profile.userId} /> : null}

          {authChecked ? (
            profile ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex h-11 items-center justify-center gap-0 rounded-lg border border-white/10 bg-white/5 p-1.5 transition hover:border-white/20 hover:bg-white/10 sm:gap-3 sm:pl-1.5 sm:pr-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4d3dc,#d8c7ff)] text-xs font-semibold text-[#151515]">
                    {profile.initials}
                  </span>
                  <span className="hidden max-w-32 truncate text-sm font-medium text-white/78 sm:block">
                    {profile.displayName}
                  </span>
                </Link>

                <CircleButton onClick={handleLogout} label="Logout">
                  <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </CircleButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="inline-flex h-11 items-center rounded-lg border border-white/10 px-4 text-sm font-medium text-white/76 transition hover:border-white/20 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex h-11 items-center rounded-lg bg-white px-4 text-sm font-semibold text-[#151515] transition hover:bg-white/90"
                >
                  Join now
                </Link>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-11 w-18 animate-pulse rounded-lg border border-white/10 bg-white/5" aria-hidden />
              <div className="h-11 w-22 animate-pulse rounded-lg bg-white/20" aria-hidden />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}