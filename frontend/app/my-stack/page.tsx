import { redirect } from 'next/navigation'

import LandingPage from '@/app/LandingPage'
import { getLandingData } from '@/lib/landing-data'
import { createClient } from '@/lib/supabase/server'

export default async function MyStackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('tech_stack')
    .eq('id', user.id)
    .maybeSingle()

  const techStack: string[] = Array.isArray(profileData?.tech_stack) ? profileData.tech_stack : []

  if (techStack.length === 0) {
    return (
      <main className="relative mx-auto flex max-w-345 grow flex-col items-center justify-center px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-black/8 bg-[#f8f6f3] dark:border-white/8 dark:bg-white/6">
              <svg className="h-10 w-10 text-[#8a6a43] dark:text-[#d7b37a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="mb-3 text-2xl font-black tracking-tight">Set up your tech stack</h1>
            <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
              You haven&apos;t selected any technologies yet. Configure your tech stack in your profile to see personalized job listings here.
            </p>
            <a
              href="/profile"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#8a6a43] bg-[#8a6a43] px-6 text-sm font-black uppercase tracking-widest text-white transition-colors hover:border-[#765936] hover:bg-[#765936] dark:border-[#d7b37a] dark:bg-[#d7b37a] dark:text-[#151515] dark:hover:border-[#c9a15e] dark:hover:bg-[#c9a15e]"
            >
              Go to Profile Settings
            </a>
          </div>
      </main>
    )
  }

  const data = await getLandingData()

  // Pre-filter jobs to only those matching user's tech stack
  const techStackLower = new Set(techStack.map((t) => t.toLowerCase()))
  const filteredJobs = data.recent_jobs.filter((job) =>
    job.technologies.some((tech) => techStackLower.has(tech.toLowerCase()))
  )

  const filteredData = {
    ...data,
    recent_jobs: filteredJobs,
    total_jobs: filteredJobs.length,
  }

  return <LandingPage data={filteredData} />
}
