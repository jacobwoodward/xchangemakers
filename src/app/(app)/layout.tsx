import { BottomNav } from '@/components/shared/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--xm-bg-page)' }}>
      <main className="mx-auto pb-20" style={{ maxWidth: 'var(--xm-content-max-width)' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
