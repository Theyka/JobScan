import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Script from 'next/script'
import { IBM_Plex_Mono, Manrope } from 'next/font/google'

import AppShell from '@/components/shared/AppShell'
import { SITE_TAGLINE, SITE_DESCRIPTION, SITE_NAME, SITE_URL, CREATOR_NAME, CREATOR_URL } from '@/lib/site-config'
import { THEME_COOKIE_NAME, THEME_PALETTE, resolveInitialTheme } from '@/lib/theme'
import './globals.css'

export const metadata: Metadata = {
  title: SITE_TAGLINE,
  description: SITE_DESCRIPTION,
  authors: [{ name: CREATOR_NAME, url: CREATOR_URL }],
  creator: CREATOR_NAME,
  publisher: CREATOR_NAME,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary',
    title: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
  },
}

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500', '600'],
})

const themeInitScript = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem('${THEME_COOKIE_NAME}');
    const hasStoredTheme = storedTheme === 'dark' || storedTheme === 'light';
    const palette = ${JSON.stringify(THEME_PALETTE)};

    const applyTheme = (nextTheme) => {
      const root = document.documentElement;
      const colors = palette[nextTheme];

      root.classList.remove('light', 'dark');
      root.classList.add(nextTheme);
      root.style.colorScheme = nextTheme;
      root.style.backgroundColor = colors.background;
      root.style.color = colors.foreground;
      document.cookie = '${THEME_COOKIE_NAME}=' + nextTheme + '; path=/; max-age=31536000; samesite=lax';
    };

    applyTheme(hasStoredTheme ? storedTheme : 'light');
  } catch {}
})();
`

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const initialTheme = resolveInitialTheme(cookieStore.get(THEME_COOKIE_NAME)?.value)
  const initialPalette = THEME_PALETTE[initialTheme]
  const gtagId = process.env.NEXT_PUBLIC_GTAG_ID

  return (
    <html
      lang="en"
      className={initialTheme}
      style={{ backgroundColor: initialPalette.background, color: initialPalette.foreground, colorScheme: initialTheme }}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {gtagId ? (
          <>
            <Script
              id="gtag-src"
              src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gtagId}');
              `}
            </Script>
          </>
        ) : null}
      </head>
      <body
        className={`${manrope.variable} ${ibmPlexMono.variable} antialiased`}
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
