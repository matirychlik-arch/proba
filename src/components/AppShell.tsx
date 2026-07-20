'use client'

import { useEffect } from 'react'
import Sidebar from './Sidebar'
import { ToastProvider } from './ui/Toast'
import { seedIfEmpty } from '@/lib/seed'

export default function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    seedIfEmpty()
  }, [])

  return (
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
