import {
  Package,
  UserPlus,
  Handshake,
  Calendar,
  Landmark,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ActivityFeedItem, ActivityType } from '@/lib/exchange-engine/types'

// ---- Activity type display config ------------------------------------------

interface ActivityConfig {
  icon: LucideIcon
  colorClass: string       // Tailwind bg for the circle
  iconColorClass: string   // Tailwind text for the icon
}

const activityConfig: Record<ActivityType, ActivityConfig> = {
  new_listing: {
    icon: Package,
    colorClass: 'bg-success/12',
    iconColorClass: 'text-success',
  },
  new_member: {
    icon: UserPlus,
    colorClass: 'bg-info/12',
    iconColorClass: 'text-info',
  },
  exchange_completed: {
    icon: Handshake,
    colorClass: 'bg-success/12',
    iconColorClass: 'text-success',
  },
  happening_posted: {
    icon: Calendar,
    colorClass: 'bg-warning/12',
    iconColorClass: 'text-warning',
  },
  treasury_milestone: {
    icon: Landmark,
    colorClass: 'bg-warning/12',
    iconColorClass: 'text-warning',
  },
  weekly_stats: {
    icon: TrendingUp,
    colorClass: 'bg-success/12',
    iconColorClass: 'text-success',
  },
}

// ---- Description builder ---------------------------------------------------

function getDescription(type: ActivityType, data: Record<string, unknown>): string {
  switch (type) {
    case 'new_listing':
      return `${data.memberName} listed ${data.title}`
    case 'new_member':
      return `Welcome ${data.memberName}, ${data.neighborhood}'s newest neighbor`
    case 'exchange_completed':
      return `${data.member1} and ${data.member2} completed an exchange`
    case 'happening_posted':
      return `${data.title} \u2014 ${data.date}`
    case 'treasury_milestone':
      return `${data.communityName} Treasury hit $${data.amount}!`
    case 'weekly_stats':
      return `${data.count} exchanges completed this week`
  }
}

// ---- Relative timestamp ----------------------------------------------------

function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

// ---- Component -------------------------------------------------------------

export interface ActivityItemProps {
  item: ActivityFeedItem
}

export function ActivityItem({ item }: ActivityItemProps) {
  const config = activityConfig[item.type]
  const Icon = config.icon
  const description = getDescription(item.type, item.data)
  const timestamp = relativeTime(item.createdAt)

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Icon circle */}
      <div
        className={`flex shrink-0 items-center justify-center rounded-full ${config.colorClass}`}
        style={{ width: 36, height: 36 }}
      >
        <Icon className={config.iconColorClass} size={18} strokeWidth={1.8} />
      </div>

      {/* Description */}
      <p
        className="flex-1 pt-0.5 text-sm leading-snug"
        style={{ color: 'var(--xm-text-body)' }}
      >
        {description}
      </p>

      {/* Timestamp */}
      <span
        className="shrink-0 pt-0.5 text-xs whitespace-nowrap"
        style={{ color: 'var(--xm-text-muted)' }}
      >
        {timestamp}
      </span>
    </div>
  )
}
