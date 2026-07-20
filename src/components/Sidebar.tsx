'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Workspace } from '@/lib/types'
import { getWorkspaces } from '@/lib/storage'
import { seedIfEmpty } from '@/lib/seed'
import { PERSONA_COLORS } from '@/lib/persona-colors'
import Logo from './Logo'

export default function Sidebar() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const pathname = usePathname()

  useEffect(() => {
    seedIfEmpty()
    setWorkspaces(getWorkspaces())
  }, [pathname])

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: 'var(--bg-sidebar)',
        borderRight: '0.5px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        gap: 24,
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
      }}
    >
      <Link href="/dashboard" style={{ textDecoration: 'none', padding: '0 10px' }}>
        <Logo />
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-placeholder)',
            padding: '0 10px',
            marginBottom: 6,
          }}
        >
          Workspace&apos;y
        </span>
        {workspaces.map((ws, i) => {
          const active = pathname.startsWith(`/workspace/${ws.id}`)
          return (
            <Link
              key={ws.id}
              href={`/workspace/${ws.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'background 0.15s',
                background: active ? '#EDE9E1' : 'transparent',
                textDecoration: 'none',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = '#EDE9E1'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: PERSONA_COLORS[i % PERSONA_COLORS.length],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 16 }}>{ws.emoji}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {ws.name}
              </span>
            </Link>
          )
        })}
        <Link
          href="/workspace/new"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE9E1')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 16, width: 8, textAlign: 'center' }}>+</span>
          <span>Nowy Workspace</span>
        </Link>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Link
          href="/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: pathname === '/settings' ? 'var(--text-primary)' : 'var(--text-muted)',
            background: pathname === '/settings' ? '#EDE9E1' : 'transparent',
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE9E1')}
          onMouseLeave={(e) => {
            if (pathname !== '/settings') e.currentTarget.style.background = 'transparent'
          }}
        >
          <span>⚙</span>
          <span>Ustawienia</span>
        </Link>
      </div>
    </aside>
  )
}
