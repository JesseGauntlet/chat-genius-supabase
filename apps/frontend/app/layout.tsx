import './globals.css'
import { Inter } from 'next/font/google'
import SupabaseProvider from '@/components/providers/supabase-provider'
import { WorkspaceProvider } from '@/components/providers/workspace-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider>
          <WorkspaceProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </WorkspaceProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
} 