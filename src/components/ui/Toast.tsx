'use client'

import { createContext, useCallback, useContext, useState } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'info' | 'error' | 'success'
}

const ToastContext = createContext<(message: string, type?: ToastItem['type']) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const colors: Record<ToastItem['type'], { bg: string; border: string }> = {
    info: { bg: 'var(--blue-pale)', border: 'var(--blue-border)' },
    error: { bg: 'var(--coral-pale)', border: 'var(--coral-border)' },
    success: { bg: 'var(--amber-pale)', border: 'var(--amber-border)' },
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 100,
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="page-enter"
            style={{
              background: colors[toast.type].bg,
              border: `0.5px solid ${colors[toast.type].border}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: 13,
              color: 'var(--text-primary)',
              maxWidth: 340,
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
