import { NextResponse } from 'next/server'

import { getCurrentUserAccess } from '@/lib/admin/access'
import { buildJobsCsv } from '@/lib/admin/jobs-export'

function buildExportFileName(): string {
  const datePart = new Date().toISOString().slice(0, 10)
  return `jobs-export-${datePart}.csv`
}

export async function GET(request: Request) {
  const access = await getCurrentUserAccess()

  if (!access) {
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (!access.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const csv = await buildJobsCsv()

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${buildExportFileName()}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build CSV export.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
