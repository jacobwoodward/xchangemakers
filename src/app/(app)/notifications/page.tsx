export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  HandHeart,
  Sparkles,
} from 'lucide-react'
import { PageTransition } from '@/components/shared/page-transition'
import { Badge, Card } from '@/components/ui'
import { exchangeEngine } from '@/lib/exchange-engine'
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from './actions'
import type {
  Notification as AppNotification,
  NotificationType,
} from '@/lib/exchange-engine'
import type { LucideIcon } from 'lucide-react'

function iconFor(type: NotificationType): LucideIcon {
  switch (type) {
    case 'urgent_need':
      return CircleAlert
    case 'matched_need':
    case 'backup_available':
      return HandHeart
    case 'offer_received':
    case 'offer_accepted':
      return CheckCircle2
    case 'event_match':
      return Sparkles
    case 'schedule_reminder':
    case 'completion_prompt':
      return CalendarClock
    default:
      return Bell
  }
}

function formatAge(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function NotificationCard({ item }: { item: AppNotification }) {
  const Icon = iconFor(item.type)
  const unread = item.readAt === null

  return (
    <Card
      className={
        unread
          ? 'border border-primary/20 bg-primary/5'
          : 'border border-border-light'
      }
    >
      <div className="flex gap-3">
        <div
          className={
            item.priority === 'urgent'
              ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error/10 text-error'
              : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'
          }
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-heading">{item.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-secondary">
                {item.body}
              </p>
            </div>
            {unread && (
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted">
              {formatAge(item.createdAt)}
            </span>
            <div className="flex items-center gap-2">
              {unread && (
                <form action={markNotificationReadAction.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="text-xs font-semibold text-secondary hover:text-heading"
                  >
                    Mark read
                  </button>
                </form>
              )}
              <Link
                href={item.targetPath}
                className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground"
              >
                Open
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default async function NotificationsPage() {
  await exchangeEngine.initialize()
  const [items, unreadCount] = await Promise.all([
    exchangeEngine.getNotifications({ limit: 40 }),
    exchangeEngine.getUnreadNotificationCount(),
  ])

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link
              href="/"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-heading shadow-card"
              aria-label="Back to pulse"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <Badge variant="primary">Action Alerts</Badge>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-heading">
                Notifications
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-secondary">
                Need matches, helper offers, event nudges, and schedule prompts.
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className="mt-1 whitespace-nowrap text-xs font-semibold text-primary hover:underline"
              >
                Mark all read
              </button>
            </form>
          )}
        </div>

        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-heading">
              {unreadCount} unread
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Alerts are capped and based on your helper preferences.
            </p>
          </div>
          <Bell size={22} className="text-primary" />
        </Card>

        {items.length > 0 ? (
          <section className="space-y-3">
            {items.map((item) => (
              <NotificationCard key={item.id} item={item} />
            ))}
          </section>
        ) : (
          <Card className="py-8 text-center">
            <Bell size={24} className="mx-auto text-muted" />
            <p className="mt-3 text-sm font-semibold text-heading">
              No notifications yet
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Matching needs and offer updates will appear here.
            </p>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
