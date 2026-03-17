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
    <nav className="mb-8 rounded-[2rem] border border-black/8 bg-white p-2 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
      <div className="flex flex-wrap gap-2">
        {LINKS.map((link) => {
          const isActive = link.id === current

          return (
            <Link
              key={link.id}
              href={link.href}
              className={`inline-flex h-10 items-center rounded-xl px-4 text-xs font-black uppercase tracking-widest transition-colors ${isActive
                ? 'bg-[#8a6a43] text-white dark:bg-[#d7b37a] dark:text-[#151515]'
                : 'text-slate-500 hover:bg-[#f8f6f3] hover:text-[#8a6a43] dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-[#d7b37a]'
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
