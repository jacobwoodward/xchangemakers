'use client'

import Link from 'next/link'
import { PressableCard, Avatar, Badge } from '@/components/ui'
import type { Member } from '@/lib/exchange-engine/types'

interface ShopLocalHighlightsProps {
  members: Member[]
}

export function ShopLocalHighlights({ members }: ShopLocalHighlightsProps) {
  if (members.length === 0) return null

  return (
    <div className="-mx-4 mt-3">
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {members.map((member) => (
          <Link
            key={member.id}
            href={`/member/${member.id}`}
            className="shrink-0"
          >
            <PressableCard className="w-[160px] flex flex-col items-center text-center py-5 px-3">
              <Avatar
                src={member.avatarUrl}
                firstName={member.firstName}
                lastName={member.lastName}
                size="lg"
              />
              <p className="mt-2.5 text-sm font-semibold text-heading leading-tight line-clamp-1">
                {member.firstName} {member.lastName}
              </p>
              {member.vibe && (
                <p className="mt-0.5 text-xs text-muted leading-snug line-clamp-1">
                  {member.vibe}
                </p>
              )}
              <Badge variant="accent" className="mt-2.5 text-[10px]">
                Shop Local
              </Badge>
            </PressableCard>
          </Link>
        ))}
      </div>
    </div>
  )
}
