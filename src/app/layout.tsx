import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/frontend/contexts/toast-context'
import { ToastManager } from '@/frontend/components/toast-manager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Content Collaboration System',
  description: 'A collaborative platform for content creation and social media management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          {children}
          <ToastManager />
        </ToastProvider>
      </body>
    </html>
  )
}