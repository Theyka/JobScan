import { redirect } from 'next/navigation'

import ProxyActionButtons from '@/app/admin/proxy/ProxyActionButtons'
import { addProxiesAction } from '@/app/admin/proxy/actions'
import AdminSectionNav from '@/components/admin/AdminSectionNav'
import { getCurrentUserAccess } from '@/lib/admin/access'
import { listProxies } from '@/lib/admin/proxy-management'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(parsed)
}

export default async function AdminProxyPage() {
  const access = await getCurrentUserAccess()

  if (!access) redirect('/auth/login')
  if (!access.isAdmin) redirect('/')

  const proxies = await listProxies().catch(() => [])
  const activeCount = proxies.filter((p) => p.isActive).length
  const failingCount = proxies.filter((p) => p.failCount > 0).length

  return (
    <main className="relative mx-auto flex max-w-345 flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full py-6 lg:py-10">
        <AdminSectionNav current="proxies" />

        {/* Add proxies form */}
        <section className="mb-6 rounded-3xl border border-black/8 bg-white p-5 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] sm:p-8">
          <h2 className="mb-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">Add Proxies</h2>
          <p className="mb-5 text-sm font-semibold text-slate-400 dark:text-slate-500">
            One entry per line. Accepts <code className="font-mono text-xs">http://user:pass@host:port</code> or shorthand <code className="font-mono text-xs">ip:port:user:pass</code>. Duplicates are ignored.
          </p>
          <form action={addProxiesAction} className="flex flex-col gap-3">
            <textarea
              name="urls"
              rows={5}
              required
              placeholder={'http://user:pass@proxy1:8080\n1.2.3.4:8080:user:pass'}
              className="w-full resize-y rounded-xl border border-black/10 bg-[#f8f6f3] px-4 py-3 font-mono text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-[#8a6a43]/40 focus:ring-2 focus:ring-[#8a6a43]/15 dark:border-white/8 dark:bg-white/4 dark:text-slate-200 dark:placeholder-slate-600 dark:focus:border-[#d7b37a]/40 dark:focus:ring-[#d7b37a]/10"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[#8a6a43]/20 bg-[#8a6a43] px-6 text-sm font-bold text-white transition-colors hover:bg-[#745634] dark:border-[#d7b37a]/30 dark:bg-[#d7b37a] dark:text-[#111111] dark:hover:bg-[#c9a76f]"
              >
                Add Proxies
              </button>
            </div>
          </form>
        </section>

        {/* Proxy table */}
        <section className="rounded-3xl border border-black/8 bg-white p-5 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] sm:p-10">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Proxy List</h2>
              <p className="mt-2 text-sm font-semibold text-slate-400 dark:text-slate-500">
                Proxies are used by the backend for translation requests to avoid rate limits.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-xl border border-black/8 bg-[#f8f6f3] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#8a6a43] dark:border-white/8 dark:bg-white/6 dark:text-[#d7b37a]">
                {activeCount} Active
              </span>
              <span className="rounded-xl border border-black/8 bg-[#f8f6f3] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:border-white/8 dark:bg-white/6 dark:text-slate-300">
                {proxies.length} Total
              </span>
              {failingCount > 0 && (
                <span className="rounded-xl border border-red-200 bg-red-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  {failingCount} Failing
                </span>
              )}
            </div>
          </div>

          {proxies.length === 0 ? (
            <p className="py-12 text-center text-sm font-semibold text-slate-400 dark:text-slate-600">
              No proxies added yet. Add some above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:border-slate-800/60 dark:text-slate-500">
                    <th className="px-3 py-4">URL</th>
                    <th className="px-3 py-4">Status</th>
                    <th className="px-3 py-4">Failures</th>
                    <th className="px-3 py-4">Last Used</th>
                    <th className="px-3 py-4">Added</th>
                    <th className="px-3 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/20">
                  {proxies.map((proxy) => (
                    <tr key={proxy.id} className="transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-5">
                        <p className="max-w-56 truncate font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 sm:max-w-xs lg:max-w-sm">
                          {proxy.url}
                        </p>
                      </td>
                      <td className="px-3 py-5">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            proxy.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-white/6 dark:text-slate-500'
                          }`}
                        >
                          {proxy.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-3 py-5">
                        <span
                          className={`text-sm font-bold ${
                            proxy.failCount > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          {proxy.failCount}
                        </span>
                      </td>
                      <td className="px-3 py-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {formatDate(proxy.lastUsedAt)}
                      </td>
                      <td className="px-3 py-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {formatDate(proxy.createdAt)}
                      </td>
                      <td className="px-3 py-5 text-right">
                        <ProxyActionButtons proxyId={proxy.id} isActive={proxy.isActive} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
