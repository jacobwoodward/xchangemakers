import { BottomNav } from '@/components/shared/bottom-nav'
import { requireCurrentMemberId } from '@/lib/auth/session'

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireCurrentMemberId()

  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--xm-bg-page)' }}>
      <main
        className="mx-auto pb-20"
        style={{ maxWidth: 'var(--xm-content-max-width)' }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
