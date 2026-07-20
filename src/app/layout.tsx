import type { Metadata } from 'next'
import './globals.css'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Proba — Marketing Prediction Tool',
  description:
    'Testuj decyzje marketingowe przez symulację reakcji grupy docelowej — zanim wydasz złotówkę na kampanię.',
  icons: {
    icon:
      'data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#4A7FF8" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="#4A7FF8"/></svg>'
      ),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
