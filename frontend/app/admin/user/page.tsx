import { redirect } from 'next/navigation'

import UserActionButtons from '@/app/admin/user/UserActionButtons'
import AdminSectionNav from '@/components/admin/AdminSectionNav'
import { getCurrentUserAccess } from '@/lib/admin/access'
import { listManagedUsers } from '@/lib/admin/user-management'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatDisplayName(firstName: string, lastName: string, username: string): string {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()
  return name || username || 'Unnamed User'
}

function formatJoinedDate(value: string): string {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

export default async function AdminUserPage() {
  const access = await getCurrentUserAccess()

  if (!access) {
    redirect('/auth/login')
  }

  if (!access.isAdmin) {
    redirect('/')
  }

  const managedUsers = await listManagedUsers().catch(() => [])
  const adminCount = managedUsers.filter((user) => user.isAdmin).length

  return (
    <main className="relative mx-auto flex max-w-345 flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full py-6 lg:py-10">
        <AdminSectionNav current="users" />

        <section className="mb-10 rounded-3xl border border-black/8 bg-white p-5 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] sm:p-10">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">User Management</h2>
              <p className="mt-2 text-sm font-semibold text-slate-400 dark:text-slate-500">
                Promote or remove admin access for other users. You cannot remove your own admin role.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-xl border border-black/8 bg-[#f8f6f3] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#8a6a43] dark:border-white/8 dark:bg-white/6 dark:text-[#d7b37a]">
                {formatNumber(managedUsers.length)} Users
              </span>
              <span className="rounded-xl border border-black/8 bg-[#f8f6f3] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:border-white/8 dark:bg-white/6 dark:text-slate-300">
                {formatNumber(adminCount)} Admins
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:border-slate-800/60 dark:text-slate-500">
                  <th className="px-3 py-4">User</th>
                  <th className="px-3 py-4">Username</th>
                  <th className="px-3 py-4">Joined</th>
                  <th className="px-3 py-4">Role</th>
                  <th className="px-3 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/20">
                {managedUsers.length ? (
                  managedUsers.map((user) => {
                    const isCurrentUser = user.id === access.userId

                    return (
                      <tr key={user.id} className="transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-5">
                          <p className="max-w-30 truncate text-sm font-bold text-slate-900 dark:text-white sm:max-w-none">
                            {formatDisplayName(user.firstName, user.lastName, user.username)}
                          </p>

                          <p className="mt-1 font-mono text-[10px] text-slate-400 dark:text-slate-500">{user.id}</p>
                        </td>
                        <td className="px-3 py-5 text-sm font-semibold text-slate-600 dark:text-slate-300">{user.username || '-'}</td>
                        <td className="px-3 py-5 text-sm font-semibold text-slate-500 dark:text-slate-400">{formatJoinedDate(user.createdAt)}</td>
                        <td className="px-3 py-5">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${user.isAdmin
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                          >
                            {user.isAdmin ? 'Admin' : 'User'}
                          </span>
                          {isCurrentUser ? (
                            <span className="ml-2 inline-flex items-center rounded-full border border-black/8 bg-[#f8f6f3] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8a6a43] dark:border-white/8 dark:bg-white/6 dark:text-[#d7b37a]">
                              You
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-5 text-right">
                          {isCurrentUser ? (
                            <span className="inline-flex rounded-xl border border-black/8 bg-[#f8f6f3] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:border-white/8 dark:bg-white/6 dark:text-slate-400">
                              Current User
                            </span>
                          ) : <UserActionButtons userId={user.id} isAdmin={user.isAdmin} />}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-3 py-16 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      No Users Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
