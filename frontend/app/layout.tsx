import type { Metadata } from 'next'
import { IBM_Plex_Mono, Manrope } from 'next/font/google'

import './globals.css'

export const metadata: Metadata = {
  title: 'JobScan | Azerbaijan IT Market Intelligence',
  description:
    'Corporate-grade monitoring of the Azerbaijan technology hiring market with merged vacancy coverage, source overlap, and live demand signals.',
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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${manrope.variable} ${ibmPlexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
