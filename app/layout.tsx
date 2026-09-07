import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/ThemeProvider'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PaperPulse',
  description: 'Turn research papers into project ideas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} dark:bg-gray-950 bg-white transition-colors`}>
        <ThemeProvider>
          {children}
          <Toaster theme="system" position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}