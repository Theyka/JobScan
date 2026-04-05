/**
 * Central site branding configuration.
 *
 * All values are resolved once at build / server-start from `NEXT_PUBLIC_*`
 * environment variables so every component shares a single source of truth.
 *
 * Required env vars (set in `.env`):
 *   NEXT_PUBLIC_SITE_NAME          – e.g. "Vakanso"
 *   NEXT_PUBLIC_SITE_DESCRIPTION   – one-liner used in meta tags & headers
 *
 * IMPORTANT: Next.js only inlines env vars when accessed as literal
 * `process.env.NEXT_PUBLIC_*` expressions — dynamic key lookups won't work.
 */

function requireLiteral(name: string, value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Add it to your .env file or hosting environment.',
    )
  }
  return trimmed
}

export const SITE_NAME: string = requireLiteral(
  'NEXT_PUBLIC_SITE_NAME',
  process.env.NEXT_PUBLIC_SITE_NAME,
)

export const SITE_DESCRIPTION: string = requireLiteral(
  'NEXT_PUBLIC_SITE_DESCRIPTION',
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
)

export const SITE_URL: string = requireLiteral(
  'NEXT_PUBLIC_SITE_URL',
  process.env.NEXT_PUBLIC_SITE_URL,
)

export const SITE_TAGLINE = `${SITE_NAME} | Azerbaijan IT Market Intelligence`

export const CREATOR_NAME = 'Theyka'
export const CREATOR_URL = 'https://github.com/Theyka'
export const REPO_URL = 'https://github.com/Theyka/JobScan'
export const LICENSE_URL = 'https://github.com/Theyka/JobScan/blob/main/LICENSE'
