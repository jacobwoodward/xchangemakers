import Link from 'next/link'
import { Bell } from 'lucide-react'
import { exchangeEngine } from '@/lib/exchange-engine'

export async function NotificationBell() {
  await exchangeEngine.initialize()
  const unreadCount = await exchangeEngine.getUnreadNotificationCount()

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-40">
      <div
        className="mx-auto flex justify-end px-4"
        style={{ maxWidth: 'var(--xm-content-max-width)' }}
      >
        <Link
          href="/notifications"
          className="pointer-events-auto relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-heading shadow-card"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : 'Notifications'
          }
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  )
}
