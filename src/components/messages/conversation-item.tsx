'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/lib/exchange-engine'

interface ConversationItemProps {
  conversation: Conversation
  currentMemberId: string
}

export function ConversationItem({
  conversation,
  currentMemberId,
}: ConversationItemProps) {
  // Find the other participant (not the current user)
  const otherParticipant = conversation.participants.find(
    (p) => p.memberId !== currentMemberId,
  )
  const other = otherParticipant?.member

  // Determine unread status: last message exists, wasn't sent by me,
  // and my lastReadAt is before the message's createdAt (or null)
  const myParticipant = conversation.participants.find(
    (p) => p.memberId === currentMemberId,
  )
  const lastMsg = conversation.lastMessage
  const isUnread =
    lastMsg &&
    lastMsg.senderId !== currentMemberId &&
    (!myParticipant?.lastReadAt ||
      new Date(myParticipant.lastReadAt) < new Date(lastMsg.createdAt))

  const displayName = other
    ? `${other.firstName} ${other.lastName}`
    : 'Unknown'

  const preview = lastMsg?.content ?? 'No messages yet'
  const timestamp = lastMsg
    ? formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })
    : ''

  // Compact the timestamp: "about 2 hours" → "2h", "3 days" → "3d", etc.
  const shortTimestamp = compactTime(timestamp)

  return (
    <Link href={`/messages/${conversation.id}`}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="flex items-center gap-3 px-4 py-3 transition-colors duration-[var(--xm-transition-fast)] active:bg-active"
      >
        {/* Avatar */}
        <Avatar
          src={other?.avatarUrl}
          firstName={other?.firstName}
          lastName={other?.lastName}
          size="md"
        />

        {/* Name + preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'text-[15px] truncate',
                isUnread ? 'font-semibold text-heading' : 'font-medium text-heading',
              )}
            >
              {displayName}
            </span>
            <span className="shrink-0 text-xs text-muted tabular-nums">
              {shortTimestamp}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p
              className={cn(
                'text-sm truncate flex-1',
                isUnread ? 'text-body font-medium' : 'text-muted',
              )}
            >
              {lastMsg?.senderId === currentMemberId ? `You: ${preview}` : preview}
            </p>
            {isUnread && (
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-info" />
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

/** Compact "about 2 hours" → "2h", "3 days" → "3d", "less than a minute" → "now" */
function compactTime(str: string): string {
  if (!str) return ''

  // Strip leading "about ", "over ", "almost ", "less than "
  const cleaned = str
    .replace(/^(about|over|almost|less than)\s+/i, '')
    .trim()

  if (/minute/.test(cleaned)) {
    const n = cleaned.match(/(\d+)/)?.[1]
    return n ? `${n}m` : 'now'
  }
  if (/hour/.test(cleaned)) {
    const n = cleaned.match(/(\d+)/)?.[1]
    return n ? `${n}h` : '1h'
  }
  if (/day/.test(cleaned)) {
    const n = cleaned.match(/(\d+)/)?.[1]
    return n ? `${n}d` : '1d'
  }
  if (/week/.test(cleaned)) {
    const n = cleaned.match(/(\d+)/)?.[1]
    return n ? `${n}w` : '1w'
  }
  if (/month/.test(cleaned)) {
    const n = cleaned.match(/(\d+)/)?.[1]
    return n ? `${n}mo` : '1mo'
  }
  if (/year/.test(cleaned)) {
    const n = cleaned.match(/(\d+)/)?.[1]
    return n ? `${n}y` : '1y'
  }
  if (/second/.test(cleaned) || cleaned === 'a minute') {
    return 'now'
  }

  return cleaned
}
