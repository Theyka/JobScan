import type { Metadata } from 'next'
import Script from 'next/script'
import { IBM_Plex_Mono, Manrope } from 'next/font/google'

import { SITE_TAGLINE, SITE_DESCRIPTION, SITE_NAME, SITE_URL, CREATOR_NAME, CREATOR_URL } from '@/lib/site-config'
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
    const storedTheme = window.localStorage.getItem('theme');
    const hasStoredTheme = storedTheme === 'dark' || storedTheme === 'light';

    const applyTheme = (nextTheme) => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(nextTheme);
      root.style.colorScheme = nextTheme;
    };

    applyTheme(hasStoredTheme ? storedTheme : 'light');
  } catch {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${manrope.variable} ${ibmPlexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
