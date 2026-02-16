import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobScan - Find Your Dream Job",
  description: "JobScan is a web application that merges multiple job boards into one platform, providing users with a comprehensive and efficient job search experience. With JobScan, users can easily browse for jobs with better filtering options.",
};

const themeInitScript = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem('theme');
    const hasStoredTheme = storedTheme === 'dark' || storedTheme === 'light';
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (nextTheme) => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(nextTheme);
      root.style.colorScheme = nextTheme;
    };

    const resolveTheme = () => (hasStoredTheme ? storedTheme : media.matches ? 'dark' : 'light');

    const resolvedTheme = resolveTheme();
    applyTheme(resolvedTheme);

    if (!hasStoredTheme) {
      const onSystemChange = (event) => {
        applyTheme(event.matches ? 'dark' : 'light');
      };

      media.addEventListener('change', onSystemChange);
    }
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
