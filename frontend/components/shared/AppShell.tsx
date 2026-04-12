'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import LandingTopBar from '@/components/landing/LandingTopBar'
import Footer from '@/components/shared/Footer'

type AppShellProps = {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isAuth = pathname?.startsWith('/auth')

  const wrapperClassName = isHome
    ? 'relative flex min-h-screen flex-col overflow-x-hidden text-foreground'
    : isAuth
      ? 'flex min-h-screen flex-col text-slate-900 dark:text-white'
      : 'flex min-h-screen flex-col text-slate-900 dark:text-white'

  const headerClassName = isHome
    ? 'sticky top-0 z-50 w-full border-b border-black/20 bg-[#151515]'
    : 'sticky top-0 z-120 w-full border-b border-black/20 bg-[#151515]'

  return (
    <div className={wrapperClassName}>
      <div className={headerClassName}>
        <div className="mx-auto max-w-345 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <LandingTopBar />
        </div>
      </div>

      {children}

      <Footer />
    </div>
  )
}
