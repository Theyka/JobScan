import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobScan - Find Your Dream Job",
  description: "JobScan is a web application that merges multiple job boards into one platform, providing users with a comprehensive and efficient job search experience. With JobScan, users can easily browse for jobs with better filtering options.",
};

const themeInitScript = `
(() => {
  try {
    const readCookieTheme = () => {
      const match = document.cookie.match(/(?:^|;\\s*)theme=(dark|light)(?:;|$)/);
      return match ? match[1] : null;
    };
    const writeCookieTheme = (value) => {
      document.cookie = \`theme=\${value}; path=/; max-age=31536000; samesite=lax\`;
    };
    const clearCookieTheme = () => {
      document.cookie = 'theme=; path=/; max-age=0; samesite=lax';
    };

    const storedTheme = window.localStorage.getItem('theme');
    const hasStoredTheme = storedTheme === 'dark' || storedTheme === 'light';
    const cookieTheme = readCookieTheme();
    const hasCookieTheme = cookieTheme === 'dark' || cookieTheme === 'light';
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (nextTheme) => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(nextTheme);
      root.style.colorScheme = nextTheme;
    };

    const resolveTheme = () => {
      if (hasStoredTheme) {
        return storedTheme;
      }
      if (hasCookieTheme) {
        return cookieTheme;
      }
      return media.matches ? 'dark' : 'light';
    };

    const resolvedTheme = resolveTheme();
    applyTheme(resolvedTheme);

    if (hasStoredTheme) {
      writeCookieTheme(storedTheme);
    } else if (hasCookieTheme) {
      window.localStorage.setItem('theme', cookieTheme);
    } else {
      clearCookieTheme();
    }

    if (!hasStoredTheme && !hasCookieTheme) {
      const onSystemChange = (event) => {
        applyTheme(event.matches ? 'dark' : 'light');
      };

      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', onSystemChange);
      } else if (typeof media.addListener === 'function') {
        media.addListener(onSystemChange);
      }
    }
  } catch {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("theme")?.value;
  const initialThemeClass = cookieTheme === "dark" || cookieTheme === "light" ? cookieTheme : undefined;

  return (
    <html lang="en" className={initialThemeClass} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
