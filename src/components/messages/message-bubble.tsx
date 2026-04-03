import { format } from 'date-fns'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Message, Member } from '@/lib/exchange-engine'

interface MessageBubbleProps {
  message: Message
  isSent: boolean
  sender?: Member
}

export function MessageBubble({ message, isSent, sender }: MessageBubbleProps) {
  const time = format(new Date(message.createdAt), 'h:mm a')

  return (
    <div
      className={cn(
        'flex gap-2 max-w-[85%]',
        isSent ? 'ml-auto flex-row-reverse' : 'mr-auto',
      )}
    >
      {/* Avatar — received messages only */}
      {!isSent && (
        <div className="shrink-0 self-end mb-5">
          <Avatar
            src={sender?.avatarUrl}
            firstName={sender?.firstName}
            lastName={sender?.lastName}
            size="xs"
          />
        </div>
      )}

      {/* Bubble */}
      <div className="flex flex-col">
        <div
          className={cn(
            'px-3.5 py-2.5 text-[15px] leading-relaxed break-words',
            isSent
              ? 'bg-primary text-primary-foreground rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-sm'
              : 'bg-surface border border-border-light text-body rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm',
          )}
        >
          {message.content}
        </div>
        <span
          className={cn(
            'mt-1 text-[11px] text-muted tabular-nums',
            isSent ? 'text-right' : 'text-left',
          )}
        >
          {time}
        </span>
      </div>
    </div>
  )
}
