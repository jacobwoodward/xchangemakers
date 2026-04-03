'use client'

import { useEffect, useRef } from 'react'
import {
  format,
  isToday,
  isYesterday,
  isSameDay,
} from 'date-fns'
import { MessageBubble } from './message-bubble'
import type { Message, Member } from '@/lib/exchange-engine'

interface MessageThreadProps {
  messages: Message[]
  currentMemberId: string
  participants: Map<string, Member>
}

/** Format date separator label */
function dateSeparatorLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export function MessageThread({
  messages,
  currentMemberId,
  participants,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on mount and when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 px-6 text-center">
        <p className="text-sm text-muted">
          Start the conversation by sending a message below.
        </p>
      </div>
    )
  }

  // Group messages and insert date separators
  const elements: React.ReactNode[] = []
  let lastDate: Date | null = null

  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt)

    // Insert date separator when the day changes
    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      elements.push(
        <div
          key={`sep-${msg.id}`}
          className="flex items-center justify-center py-3"
        >
          <span className="px-3 py-1 text-xs font-medium text-muted bg-hover rounded-full">
            {dateSeparatorLabel(msgDate)}
          </span>
        </div>,
      )
      lastDate = msgDate
    }

    const isSent = msg.senderId === currentMemberId
    const sender = !isSent ? participants.get(msg.senderId) : undefined

    elements.push(
      <MessageBubble
        key={msg.id}
        message={msg}
        isSent={isSent}
        sender={sender}
      />,
    )
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {elements}
      <div ref={bottomRef} />
    </div>
  )
}
