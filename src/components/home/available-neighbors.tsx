'use client'

import Link from 'next/link'
import { Avatar } from '@/components/ui'
import type { Member } from '@/lib/exchange-engine/types'

interface AvailableNeighborsProps {
  members: Member[]
}

export function AvailableNeighbors({ members }: AvailableNeighborsProps) {
  if (members.length === 0) return null

  return (
    <div className="mt-3 flex gap-4 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
      {members.map((member) => (
        <Link
          key={member.id}
          href={`/member/${member.id}`}
          className="shrink-0 flex flex-col items-center gap-1.5 group"
        >
          <div className="rounded-full p-[2px] bg-gradient-to-br from-primary to-primary-light transition-transform duration-[var(--xm-transition-fast)] group-active:scale-95">
            <div className="rounded-full bg-surface p-[2px]">
              <Avatar
                src={member.avatarUrl}
                firstName={member.firstName}
                lastName={member.lastName}
                size="md"
                isAvailable
              />
            </div>
          </div>
          <span className="text-[11px] font-medium text-secondary leading-none max-w-[52px] text-center truncate">
            {member.firstName}
          </span>
        </Link>
      ))}
    </div>
  )
}
