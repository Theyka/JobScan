import { redirect } from 'next/navigation'

import Footer from '@/components/shared/Footer'
import SiteHeader from '@/components/shared/SiteHeader'
import { createClient } from '@/lib/supabase/server'

import ProfileForm from './ProfileForm'

function pickText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const metadata = user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {}
  const firstName = pickText((metadata as Record<string, unknown>).first_name)
  const lastName = pickText((metadata as Record<string, unknown>).last_name)
  const username = pickText((metadata as Record<string, unknown>).username)
  const email = pickText(user.email)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      <div className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-[#0f172a]/80">
        <div className="container mx-auto max-w-7xl px-4">
          <SiteHeader
            className="border-none !pb-4 !pt-4"
            title="JobScan"
            subtitle="Personal Identity"
          />
        </div>
      </div>

      <main className="flex-grow py-12 lg:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <ProfileForm
            email={email}
            initialFirstName={firstName}
            initialLastName={lastName}
            initialUsername={username}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
