'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from '@/lib/notifications'

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

function notificationIcon(type: string) {
  if (type === 'vacancy_expired') {
    return (
      <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

type NotificationBellProps = {
  userId: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // Load initial data
  useEffect(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {})
  }, [])

  // Load notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      getUserNotifications(20).then(setNotifications).catch(() => {})
    }
  }, [isOpen])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev].slice(0, 20))
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/72 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        aria-label="Notifications"
      >
        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-70 mt-2 w-80 origin-top-right rounded-xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-[#1a1a1a]">
          <div className="flex items-center justify-between border-b border-black/8 px-4 py-3 dark:border-white/8">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-[#8a6a43] hover:text-[#765936] dark:text-[#d7b37a] dark:hover:text-[#c9a15e]"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="custom-scrollbar max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => {
                const metadata = notification.metadata as Record<string, string>
                const href = metadata.slug && metadata.source
                  ? `/vacancies/${metadata.source}/${metadata.slug}`
                  : '#'

                return (
                  <a
                    key={notification.id}
                    href={href}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkRead(notification.id)
                      }
                    }}
                    className={`flex gap-3 border-b border-black/5 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5 ${
                      !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{notificationIcon(notification.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold ${!notification.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-500">
                          {notification.body}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-600">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </a>
                )
              })
            )}
          </div>

          <div className="border-t border-black/8 px-4 py-2 dark:border-white/8">
            <a
              href="/notifications"
              className="block text-center text-xs font-medium text-[#8a6a43] hover:text-[#765936] dark:text-[#d7b37a] dark:hover:text-[#c9a15e]"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
