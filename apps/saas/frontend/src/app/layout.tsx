import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { OrganizationProvider } from '@/components/organization-provider'

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
      <body className="font-sans antialiased">
        <ThemeProvider
          defaultTheme="system"
        >
          <OrganizationProvider>
            {children}
            <Toaster />
          </OrganizationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}