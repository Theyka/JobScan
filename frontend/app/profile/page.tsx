import { redirect } from 'next/navigation'

import Footer from '@/components/landing/Footer'
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
    <div className="min-h-screen bg-gray-50 text-gray-800 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <SiteHeader className="mb-8" title="JobScan" subtitle="Manage your account" />
        <ProfileForm
          email={email}
          initialFirstName={firstName}
          initialLastName={lastName}
          initialUsername={username}
        />
      </div>
      <Footer />
    </div>
  )
}
