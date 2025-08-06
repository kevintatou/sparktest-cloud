import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '../components/theme-provider'
import { Toaster } from '../components/toaster'

export const metadata: Metadata = {
  title: 'SparkTest SaaS',
  description: 'Test execution platform for modern developers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}