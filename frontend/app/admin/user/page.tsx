import { redirect } from 'next/navigation'

import { updateManagedUserAdminAction } from '@/app/admin/actions'
import AdminSectionNav from '@/components/admin/AdminSectionNav'
import Footer from '@/components/shared/Footer'
import SiteHeader from '@/components/shared/SiteHeader'
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
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 transition-colors duration-300 dark:bg-[#020617] dark:text-slate-100">
      <div className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-[#0f172a]/80">
        <div className="container mx-auto max-w-7xl px-4">
          <SiteHeader className="border-none !pt-4 !pb-4" title="User Management" subtitle="Manage admin permissions" />
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        <AdminSectionNav current="users" />

        <section className="mb-10 rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">User Management</h2>
              <p className="mt-2 text-sm font-semibold text-slate-400 dark:text-slate-500">
                Promote or remove admin access for other users. You cannot remove your own admin role.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-indigo-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                {formatNumber(managedUsers.length)} Users
              </span>
              <span className="rounded-xl bg-slate-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
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
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
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
                            <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                              You
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-5 text-right">
                          {isCurrentUser ? (
                            <span className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                              Current User
                            </span>
                          ) : (
                            <form action={updateManagedUserAdminAction} className="inline-flex">
                              <input type="hidden" name="target_user_id" value={user.id} />
                              <input type="hidden" name="next_is_admin" value={user.isAdmin ? 'false' : 'true'} />
                              <button
                                type="submit"
                                className={`inline-flex cursor-pointer items-center rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${user.isAdmin
                                    ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25'
                                  }`}
                              >
                                {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                              </button>
                            </form>
                          )}
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

      <div className="w-full border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
        <Footer />
      </div>
    </div>
  )
}
