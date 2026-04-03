import { MessageCircle } from 'lucide-react'
import { ConversationItem } from './conversation-item'
import type { Conversation } from '@/lib/exchange-engine'

interface ConversationListProps {
  conversations: Conversation[]
  currentMemberId: string
}

export function ConversationList({
  conversations,
  currentMemberId,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-hover mb-4">
          <MessageCircle size={28} className="text-muted" />
        </div>
        <p className="text-base font-semibold text-heading">
          No messages yet
        </p>
        <p className="mt-1 text-sm text-muted max-w-[240px]">
          When you start a conversation with a neighbor, it will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border-light">
      {conversations.map((c) => (
        <ConversationItem
          key={c.id}
          conversation={c}
          currentMemberId={currentMemberId}
        />
      ))}
    </div>
  )
}
