import { redirect } from 'next/navigation'

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

  // Fetch tech_stack from profiles table
  let techStack: string[] = []
  const { data: profileData } = await supabase.from('profiles').select('tech_stack').eq('id', user.id).maybeSingle()
  if (profileData) {
    if (Array.isArray(profileData.tech_stack)) {
      techStack = profileData.tech_stack
    }
  }

  return (
    <main className="relative mx-auto flex max-w-345 grow flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl py-6 lg:py-10">
          <ProfileForm
            email={email}
            initialFirstName={firstName}
            initialLastName={lastName}
            initialUsername={username}
            initialTechStack={techStack}
          />
        </div>
    </main>
  )
}
