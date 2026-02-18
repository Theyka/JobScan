import Link from 'next/link'

type AdminSection = 'stats' | 'users' | 'export'

type AdminSectionNavProps = {
  current: AdminSection
}

const LINKS: Array<{ id: AdminSection; href: string; label: string }> = [
  { id: 'stats', href: '/admin', label: 'Statistics' },
  { id: 'users', href: '/admin/user', label: 'Users' },
  { id: 'export', href: '/admin/export', label: 'Export' },
]

export default function AdminSectionNav({ current }: AdminSectionNavProps) {
  return (
    <nav className="mb-8 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex flex-wrap gap-2">
        {LINKS.map((link) => {
          const isActive = link.id === current

          return (
            <Link
              key={link.id}
              href={link.href}
              className={`inline-flex h-10 items-center rounded-xl px-4 text-xs font-black uppercase tracking-widest transition-colors ${isActive
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
