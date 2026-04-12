import { redirect } from 'next/navigation'

import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/server'

import NotificationsList from './NotificationsList'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const notifications = await getUserNotifications(100)

  return (
    <main className="relative mx-auto flex max-w-345 grow flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl py-6 lg:py-10">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              Activity
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Notifications</h1>
          </div>

          <NotificationsList initialNotifications={notifications} />
        </div>
    </main>
  )
}
