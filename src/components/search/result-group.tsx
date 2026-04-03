import type { LucideIcon } from 'lucide-react'
import type { MemberWithDetails } from '@/lib/exchange-engine'
import { MemberResultCard } from './member-result-card'

interface ResultGroupProps {
  title: string
  members: MemberWithDetails[]
  icon?: LucideIcon
}

export function ResultGroup({ title, members, icon: Icon }: ResultGroupProps) {
  if (members.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-2.5">
        {Icon && (
          <Icon size={15} className="text-secondary shrink-0" />
        )}
        <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider">
          {title}
        </h2>
        <span className="text-xs text-muted">({members.length})</span>
      </div>
      <div className="space-y-2">
        {members.map((member) => (
          <MemberResultCard key={member.id} member={member} />
        ))}
      </div>
    </section>
  )
}
