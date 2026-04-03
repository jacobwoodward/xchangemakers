import type { ActivityFeedItem } from '@/lib/exchange-engine/types'
import { ActivityItem } from '@/components/activity/activity-item'

export interface ActivityListProps {
  items: ActivityFeedItem[]
}

export function ActivityList({ items }: ActivityListProps) {
  return (
    <div
      className="divide-y"
      style={{ borderColor: 'var(--xm-border-light)' }}
    >
      {items.map((item) => (
        <ActivityItem key={item.id} item={item} />
      ))}
    </div>
  )
}
