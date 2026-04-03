import { Badge } from '@/components/ui'
import type { ReputationTagCount, ReputationTagType } from '@/lib/exchange-engine'
import {
  Clock,
  Star,
  Heart,
  Gift,
  Shield,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'

interface ReputationTagsProps {
  tags: ReputationTagCount[]
}

const TAG_CONFIG: Record<
  ReputationTagType,
  { label: string; icon: LucideIcon }
> = {
  on_time: { label: 'On Time', icon: Clock },
  quality: { label: 'Quality', icon: Star },
  friendly: { label: 'Friendly', icon: Heart },
  generous: { label: 'Generous', icon: Gift },
  reliable: { label: 'Reliable', icon: Shield },
  great_communicator: { label: 'Great Communicator', icon: MessageCircle },
}

export function ReputationTags({ tags }: ReputationTagsProps) {
  if (tags.length === 0) return null

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
        Reputation
      </h3>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tags.map(({ tag, count }) => {
          const config = TAG_CONFIG[tag]
          if (!config) return null
          const Icon = config.icon

          return (
            <Badge
              key={tag}
              variant="primary"
              className="shrink-0 gap-1 py-1 px-2.5"
            >
              <Icon size={12} />
              <span>{config.label}</span>
              <span className="opacity-70">x{count}</span>
            </Badge>
          )
        })}
      </div>
    </section>
  )
}
