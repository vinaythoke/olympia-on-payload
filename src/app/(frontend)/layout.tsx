import React from 'react'
import './styles.css'
import { Navbar } from '@/components/layout/Navbar'
import { Toaster } from '@/components/ui/sonner'
import PWAProvider from '@/components/layout/PWAProvider'
import { Footer } from '@/components/layout/Footer'
import { Viewport } from 'next'

export const metadata = {
  description: 'Project Olympia - Sports Event Management Platform',
  title: 'Project Olympia',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Olympia',
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <PWAProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-16">{children}</main>
            <Footer />
          </div>
          <Toaster richColors />
        </PWAProvider>
      </body>
    </html>
  )
}
