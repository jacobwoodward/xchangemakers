'use client'

import { useMemo, useOptimistic, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flag,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  Star,
  UserRound,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CANCELLATION_REASON_OPTIONS } from '@/lib/cancellation'
import { Avatar, Badge, Button, Card, StatusStepper } from '@/components/ui'
import type { Step } from '@/components/ui/status-stepper'
import { MessageThread } from '@/components/messages/message-thread'
import { ReviewForm } from './review-form'
import {
  acceptExchangeAction,
  cancelExchangeAction,
  completeExchangeAction,
  createReviewAction,
  disputeExchangeAction,
  scheduleExchangeAction,
  sendExchangeMessageAction,
} from '@/app/exchange/[id]/actions'
import type {
  ExchangeRoom as ExchangeRoomData,
  ExchangeStatus,
  CancellationReason,
  Member,
  Message,
  ReputationTagType,
  TransactionType,
} from '@/lib/exchange-engine'

interface ExchangeRoomProps {
  room: ExchangeRoomData
}

const STATUS_META: Record<
  ExchangeStatus,
  { label: string; variant: 'default' | 'primary' | 'accent' | 'outline' }
> = {
  requested: { label: 'Requested', variant: 'outline' },
  accepted: { label: 'Accepted', variant: 'accent' },
  in_escrow: { label: 'Scheduled', variant: 'accent' },
  completed: { label: 'Completed', variant: 'primary' },
  cancelled: { label: 'Cancelled', variant: 'default' },
  disputed: { label: 'Disputed', variant: 'default' },
}

const TRANSACTION_LABELS: Record<TransactionType, string> = {
  earned: 'Earned',
  spent: 'Spent',
  escrow_hold: 'Held',
  escrow_release: 'Released',
  escrow_return: 'Returned',
}

function getSteps(status: ExchangeStatus): Step[] {
  if (status === 'cancelled') {
    return [
      { label: 'Requested', status: 'completed' },
      { label: 'Accepted', status: 'pending' },
      { label: 'Scheduled', status: 'pending' },
      { label: 'Cancelled', status: 'active' },
    ]
  }

  if (status === 'disputed') {
    return [
      { label: 'Requested', status: 'completed' },
      { label: 'Accepted', status: 'completed' },
      { label: 'Scheduled', status: 'completed' },
      { label: 'Disputed', status: 'active' },
    ]
  }

  const stages: ExchangeStatus[] = ['requested', 'accepted', 'in_escrow', 'completed']
  const currentIndex = stages.indexOf(status)
  return [
    {
      label: 'Requested',
      status: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'active' : 'pending',
    },
    {
      label: 'Accepted',
      status: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'active' : 'pending',
    },
    {
      label: 'Scheduled',
      status: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'active' : 'pending',
    },
    {
      label: 'Completed',
      status: currentIndex >= 3 ? 'completed' : 'pending',
    },
  ]
}

function formatSchedule(room: ExchangeRoomData): string {
  if (!room.booking && !room.exchange.scheduledAt) return 'Not scheduled'

  const dateValue = room.booking?.date ?? room.exchange.scheduledAt
  if (!dateValue) return 'Not scheduled'

  const date = new Date(dateValue)
  const day = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  if (!room.booking) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return `${day}, ${room.booking.startTime} to ${room.booking.endTime}`
}

function getInputDate(value: string | null | undefined): string {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

export function ExchangeRoom({ room }: ExchangeRoomProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [messageValue, setMessageValue] = useState('')
  const [date, setDate] = useState(
    getInputDate(room.booking?.date ?? room.exchange.scheduledAt),
  )
  const [startTime, setStartTime] = useState(room.booking?.startTime ?? '09:00')
  const [endTime, setEndTime] = useState(room.booking?.endTime ?? '10:00')
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [cancelReason, setCancelReason] =
    useState<CancellationReason>('schedule_conflict')
  const [cancelNote, setCancelNote] = useState('')

  const participants = useMemo(() => {
    const map = new Map<string, Member>()
    map.set(room.currentMember.id, room.currentMember)
    map.set(room.counterparty.id, room.counterparty)
    for (const participant of room.conversation.participants) {
      if (participant.member) map.set(participant.memberId, participant.member)
    }
    return map
  }, [room])

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    room.messages,
    (state: Message[], message: Message) => [...state, message],
  )

  const statusMeta = STATUS_META[room.exchange.status]
  const isProvider = room.currentRole === 'provider'
  const canSchedule = Boolean(room.can.schedule && date && startTime && endTime)

  function runAction(
    label: string,
    action: () => Promise<{ success?: boolean; error?: string }>,
  ) {
    setError(null)
    setPendingAction(label)
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
      setPendingAction(null)
    })
  }

  function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const content = messageValue.trim()
    if (!content) return

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: room.conversation.id,
      senderId: room.currentMember.id,
      content,
      createdAt: new Date().toISOString(),
    }

    setMessageValue('')
    addOptimisticMessage(optimisticMessage)
    runAction('message', () =>
      sendExchangeMessageAction(room.exchange.id, room.conversation.id, content),
    )
  }

  function handleReview(tags: ReputationTagType[], note: string) {
    runAction('review', () =>
      createReviewAction(room.exchange.id, room.counterparty.id, tags, note),
    )
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Exchange room
            </p>
            <h1 className="mt-1 text-xl font-bold leading-tight text-heading">
              {room.exchange.listing?.title ?? 'Exchange'}
            </h1>
          </div>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>

        <div className="flex items-center gap-3">
          <Avatar
            src={room.counterparty.avatarUrl}
            firstName={room.counterparty.firstName}
            lastName={room.counterparty.lastName}
            size="md"
            isAvailable={room.counterparty.isAvailable}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-heading">
              {room.counterparty.firstName} {room.counterparty.lastName}
            </p>
            <p className="text-xs text-muted">
              {isProvider ? 'Requester' : 'Provider'} in {room.counterparty.neighborhood}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-hover px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Clock size={13} />
              Credits
            </div>
            <p className="mt-1 text-lg font-bold text-primary tabular-nums">
              {room.exchange.tuAmount}
            </p>
          </div>
          <div className="rounded-lg bg-hover px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <CalendarDays size={13} />
              Schedule
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-heading">
              {formatSchedule(room)}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <StatusStepper steps={getSteps(room.exchange.status)} />
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-error/15 bg-error/8 px-3 py-2.5">
          <AlertCircle size={16} className="shrink-0 text-error" />
          <p className="text-xs font-medium text-error">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {room.can.accept && (
          <Button
            variant="primary"
            className="w-full"
            isLoading={isPending && pendingAction === 'accept'}
            onClick={() => runAction('accept', () => acceptExchangeAction(room.exchange.id))}
          >
            <CheckCircle2 size={16} />
            Accept
          </Button>
        )}
        {room.can.complete && (
          <Button
            variant="primary"
            className="w-full"
            isLoading={isPending && pendingAction === 'complete'}
            onClick={() => runAction('complete', () => completeExchangeAction(room.exchange.id))}
          >
            <ShieldCheck size={16} />
            Complete
          </Button>
        )}
        {room.can.cancel && (
          <Button
            variant="secondary"
            className="w-full"
            isLoading={isPending && pendingAction === 'cancel'}
            onClick={() => setIsConfirmingCancel(true)}
          >
            <XCircle size={16} />
            Cancel
          </Button>
        )}
        {room.can.dispute && (
          <Button
            variant="ghost"
            className="w-full"
            isLoading={isPending && pendingAction === 'dispute'}
            onClick={() => runAction('dispute', () => disputeExchangeAction(room.exchange.id))}
          >
            <Flag size={16} />
            Dispute
          </Button>
        )}
      </div>

      {room.can.cancel && isConfirmingCancel && (
        <Card className="space-y-3 border-error/20 bg-error/5">
          <div>
            <h2 className="text-sm font-semibold text-heading">
              Cancel exchange
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-secondary">
              Held credits return to the requester. If this came from a timed
              need, the need lifecycle will update automatically.
            </p>
          </div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Reason
            <select
              value={cancelReason}
              onChange={(event) =>
                setCancelReason(event.target.value as CancellationReason)
              }
              className="mt-1 h-10 w-full rounded-lg border border-border bg-page px-3 text-sm font-medium normal-case tracking-normal text-heading outline-none focus:ring-2 focus:ring-primary/20"
            >
              {CANCELLATION_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Optional note
            <textarea
              value={cancelNote}
              onChange={(event) => setCancelNote(event.target.value)}
              rows={3}
              maxLength={240}
              className="mt-1 w-full resize-y rounded-lg border border-border bg-page px-3 py-2 text-sm normal-case tracking-normal text-body outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Add context for the other member and steward review."
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setIsConfirmingCancel(false)}
            >
              Keep exchange
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-error hover:bg-error/8"
              isLoading={isPending && pendingAction === 'cancel'}
              onClick={() =>
                runAction('cancel', () =>
                  cancelExchangeAction(room.exchange.id, {
                    reason: cancelReason,
                    note: cancelNote,
                  }),
                )
              }
            >
              Confirm cancel
            </Button>
          </div>
        </Card>
      )}

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-heading">Schedule</h2>
            <p className="text-xs text-muted">{formatSchedule(room)}</p>
          </div>
          {room.booking?.status && (
            <Badge variant="outline">{room.booking.status}</Badge>
          )}
        </div>

        {room.can.schedule ? (
          <form
            className="grid grid-cols-2 gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!canSchedule) return
              runAction('schedule', () =>
                scheduleExchangeAction(room.exchange.id, date, startTime, endTime),
              )
            }}
          >
            <label className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-page px-3 text-sm text-body outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              Start
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-page px-3 text-sm text-body outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              End
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-page px-3 text-sm text-body outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <Button
              type="submit"
              variant="accent"
              className="col-span-2 w-full"
              disabled={!canSchedule}
              isLoading={isPending && pendingAction === 'schedule'}
            >
              <CalendarDays size={16} />
              Save Schedule
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-hover px-3 py-2.5">
            <CalendarDays size={16} className="text-secondary" />
            <p className="text-sm text-secondary">{formatSchedule(room)}</p>
          </div>
        )}
      </Card>

      <Card noPadding className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border-light px-4 py-3">
          <MessageCircle size={17} className="text-secondary" />
          <h2 className="text-sm font-semibold text-heading">Messages</h2>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          <MessageThread
            messages={optimisticMessages}
            currentMemberId={room.currentMember.id}
            participants={participants}
          />
        </div>
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 border-t border-border-light px-3 py-2"
        >
          <input
            type="text"
            value={messageValue}
            onChange={(e) => setMessageValue(e.target.value)}
            placeholder="Message..."
            className="h-10 min-w-0 flex-1 rounded-full bg-hover px-4 text-[15px] text-body outline-none placeholder:text-muted focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={!messageValue.trim() || (isPending && pendingAction === 'message')}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
              messageValue.trim()
                ? 'bg-primary text-primary-foreground'
                : 'bg-hover text-muted',
            )}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <RotateCcw size={17} className="text-secondary" />
          <h2 className="text-sm font-semibold text-heading">Credit Ledger</h2>
        </div>
        <div className="space-y-2">
          {room.ledger.length === 0 ? (
            <p className="text-sm text-muted">No credit movement yet.</p>
          ) : (
            room.ledger.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-hover px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-heading">
                    {TRANSACTION_LABELS[entry.type]}
                  </p>
                  <p className="truncate text-xs text-muted">{entry.description}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-primary tabular-nums">
                  {entry.amount}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>

      {room.exchange.status === 'completed' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Star size={17} className="text-secondary" />
            <h2 className="text-sm font-semibold text-heading">Review</h2>
          </div>
          {room.currentMemberReview ? (
            <Card className="flex items-center gap-3">
              <UserRound size={18} className="text-primary" />
              <p className="text-sm text-secondary">
                Your review for {room.counterparty.firstName} has been saved.
              </p>
            </Card>
          ) : (
            <ReviewForm
              exchange={room.exchange}
              reviewee={room.counterparty}
              onSubmit={handleReview}
              isSubmitting={isPending && pendingAction === 'review'}
            />
          )}
        </div>
      )}
    </div>
  )
}
