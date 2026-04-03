'use client'

import { useMemo, useState, useOptimistic } from 'react'
import { MessageThread } from './message-thread'
import { MessageInput } from './message-input'
import { sendMessageAction } from '@/app/messages/[id]/actions'
import type { Message, Member } from '@/lib/exchange-engine'

interface ThreadClientProps {
  conversationId: string
  initialMessages: Message[]
  currentMemberId: string
  /** Plain object from server — reconstructed to Map on client */
  participants: Record<string, Member>
}

export function ThreadClient({
  conversationId,
  initialMessages,
  currentMemberId,
  participants: participantsRecord,
}: ThreadClientProps) {
  // Reconstruct Map from the serializable record
  const participants = useMemo(
    () => new Map(Object.entries(participantsRecord)),
    [participantsRecord],
  )
  const [isLoading, setIsLoading] = useState(false)

  // Optimistic messages for instant feedback
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    initialMessages,
    (state: Message[], newMessage: Message) => [...state, newMessage],
  )

  async function handleSend(content: string) {
    // Create optimistic message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: currentMemberId,
      content,
      createdAt: new Date().toISOString(),
    }

    addOptimisticMessage(tempMessage)
    setIsLoading(true)

    try {
      const result = await sendMessageAction(conversationId, content)
      if (result.error) {
        console.error('Failed to send message:', result.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="pt-14 pb-20 min-h-dvh flex flex-col justify-end">
        <MessageThread
          messages={optimisticMessages}
          currentMemberId={currentMemberId}
          participants={participants}
        />
      </div>
      <MessageInput onSend={handleSend} isLoading={isLoading} />
    </>
  )
}
