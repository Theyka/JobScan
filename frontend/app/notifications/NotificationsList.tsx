'use client'

import { useState } from 'react'

import { markNotificationRead, markAllNotificationsRead, type Notification } from '@/lib/notifications'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationsList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
              filter === 'all'
                ? 'bg-[#8a6a43] text-white dark:bg-[#d7b37a] dark:text-[#151515]'
                : 'bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/8 dark:text-slate-300 dark:hover:bg-white/12'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
              filter === 'unread'
                ? 'bg-[#8a6a43] text-white dark:bg-[#d7b37a] dark:text-[#151515]'
                : 'bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/8 dark:text-slate-300 dark:hover:bg-white/12'
            }`}
          >
            Unread ({notifications.filter((n) => !n.is_read).length})
          </button>
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-xs font-medium text-[#8a6a43] hover:text-[#765936] dark:text-[#d7b37a] dark:hover:text-[#c9a15e]"
        >
          Mark all read
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/8 bg-white dark:border-white/8 dark:bg-[#151515]">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-400 dark:text-slate-500">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </div>
        ) : (
          filtered.map((notification) => {
            const metadata = notification.metadata as Record<string, string>
            const href = metadata.slug && metadata.source
              ? `/vacancies/${metadata.source}/${metadata.slug}`
              : '#'

            return (
              <a
                key={notification.id}
                href={href}
                onClick={() => {
                  if (!notification.is_read) handleMarkRead(notification.id)
                }}
                className={`flex gap-4 border-b border-black/5 px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5 ${
                  !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {notification.type === 'vacancy_expired' ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                      <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                      <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${!notification.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                      {notification.body}
                    </p>
                  )}
                  <p className="mt-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-600">
                    {timeAgo(notification.created_at)}
                  </p>
                </div>

                {!notification.is_read && (
                  <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                )}
              </a>
            )
          })
        )}
      </div>
    </div>
  )
}
