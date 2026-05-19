'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CalendarClock,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  RotateCcw,
  UserCheck,
  XCircle,
} from 'lucide-react'
import {
  acceptNeedOfferAction,
  cancelTimedNeedAction,
  markNeedStillNeedsHelpAction,
  offerNeedHelpAction,
  repostTimedNeedAction,
  withdrawNeedOfferAction,
} from '@/app/(app)/needs/actions'
import { Avatar, Badge, Button, Card } from '@/components/ui'
import { CANCELLATION_REASON_OPTIONS } from '@/lib/cancellation'
import { formatCategory, formatCredits } from '@/lib/marketplace'
import { cn } from '@/lib/utils'
import type {
  CancellationReason,
  NeedOffer,
  NeedWindow,
  TimedNeed,
} from '@/lib/exchange-engine'

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatWindow(window: NeedWindow): string {
  return `${formatDateTime(window.startsAt)} - ${formatTime(window.endsAt)}`
}

function formatDistance(distanceMiles: number | null): string {
  if (distanceMiles === null) return 'Nearby'
  if (distanceMiles < 0.1) return 'Under 0.1 mi'
  return `${distanceMiles.toFixed(1)} mi`
}

function offerStatusLabel(offer: NeedOffer): string {
  if (offer.status === 'accepted') return 'Accepted'
  if (offer.status === 'declined') return 'Backup'
  if (offer.status === 'withdrawn') return 'Withdrawn'
  if (offer.status === 'expired') return 'Expired'
  return 'Offered'
}

export function TimedNeedCard({ need }: { need: TimedNeed }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [isConfirmingWithdraw, setIsConfirmingWithdraw] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [isReposted, setIsReposted] = useState(false)
  const [isRefreshed, setIsRefreshed] = useState(false)
  const [cancelReason, setCancelReason] =
    useState<CancellationReason>('no_longer_needed')
  const [cancelNote, setCancelNote] = useState('')
  const [withdrawReason, setWithdrawReason] =
    useState<CancellationReason>('schedule_conflict')
  const [withdrawNote, setWithdrawNote] = useState('')
  const selectableWindows = need.windows.filter((window) =>
    ['open', 'offered'].includes(window.status),
  )
  const [selectedWindowId, setSelectedWindowId] = useState(
    selectableWindows[0]?.id ?? need.windows[0]?.id ?? '',
  )

  const activeOfferCount = useMemo(
    () =>
      need.offers.filter((offer) =>
        ['offered', 'accepted'].includes(offer.status),
      ).length,
    [need.offers],
  )

  const activeCurrentMemberOffer =
    need.currentMemberOffer &&
    ['offered', 'accepted'].includes(need.currentMemberOffer.status)
      ? need.currentMemberOffer
      : null
  const canOffer =
    !need.isOwnedByCurrentMember &&
    selectableWindows.length > 0 &&
    !activeCurrentMemberOffer
  const canCancelNeed =
    need.isOwnedByCurrentMember &&
    !['assigned', 'confirmed', 'completed', 'cancelled'].includes(
      need.listing.needStatus ?? '',
    )
  const canRepostNeed =
    need.isOwnedByCurrentMember &&
    !['assigned', 'confirmed', 'completed', 'cancelled', 'reposted'].includes(
      need.listing.needStatus ?? '',
    )
  const canMarkStillNeedsHelp = canRepostNeed && activeOfferCount === 0

  function handleOfferHelp() {
    if (!selectedWindowId) return
    setError(null)

    startTransition(async () => {
      const result = await offerNeedHelpAction({
        needId: need.listing.id,
        windowId: selectedWindowId,
        message,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setMessage('')
      router.refresh()
    })
  }

  function handleAcceptOffer(offerId: string) {
    setError(null)

    startTransition(async () => {
      const result = await acceptNeedOfferAction(offerId)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.exchangeId) {
        router.push(`/exchange/${result.exchangeId}?accepted=1`)
      } else {
        router.refresh()
      }
    })
  }

  function handleCancelNeed() {
    setError(null)

    startTransition(async () => {
      const result = await cancelTimedNeedAction(need.listing.id, {
        reason: cancelReason,
        note: cancelNote,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setIsConfirmingCancel(false)
      setIsCancelled(true)
      router.refresh()
    })
  }

  function handleWithdrawOffer() {
    if (!activeCurrentMemberOffer) return
    setError(null)

    startTransition(async () => {
      const result = await withdrawNeedOfferAction(activeCurrentMemberOffer.id, {
        reason: withdrawReason,
        note: withdrawNote,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setIsConfirmingWithdraw(false)
      router.refresh()
    })
  }

  function handleRepostNeed() {
    setError(null)

    startTransition(async () => {
      const result = await repostTimedNeedAction(need.listing.id)

      if (result.error) {
        setError(result.error)
        return
      }

      setIsReposted(true)
      router.refresh()
    })
  }

  function handleStillNeedsHelp() {
    setError(null)

    startTransition(async () => {
      const result = await markNeedStillNeedsHelpAction(need.listing.id)

      if (result.error) {
        setError(result.error)
        return
      }

      setIsRefreshed(true)
      router.refresh()
    })
  }

  if (isCancelled || isReposted) return null

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div
            className={cn(
              'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
              need.listing.isUrgent ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary',
            )}
          >
            {need.listing.isUrgent ? <AlertCircle size={20} /> : <CalendarClock size={20} />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={need.listing.isUrgent ? 'accent' : 'default'}>
                {need.listing.isUrgent ? 'Needs help now' : formatCategory(need.listing.category)}
              </Badge>
              <Badge variant="outline">{formatCredits(need.listing.creditPrice)}</Badge>
            </div>
            <h3 className="mt-2 text-base font-semibold leading-snug text-heading">
              {need.listing.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-secondary">
              {need.listing.description}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right text-xs font-medium text-muted">
          <div className="inline-flex items-center gap-1">
            <Navigation size={12} />
            {formatDistance(need.distanceMiles)}
          </div>
        </div>
      </div>

      <div className="grid gap-2 text-sm text-secondary sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Avatar
            src={need.requester.avatarUrl}
            firstName={need.requester.firstName}
            lastName={need.requester.lastName}
            size="sm"
            isAvailable={need.requester.isAvailable}
          />
          <span className="min-w-0 truncate">
            {need.requester.firstName} {need.requester.lastName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-muted" />
          <span className="min-w-0 truncate">
            {need.listing.publicLocationLabel ?? need.requester.neighborhood}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
          <Clock size={14} />
          Time windows
        </div>
        <div className="space-y-2">
          {need.windows.map((window) => {
            const isSelected = selectedWindowId === window.id
            const isSelectable = selectableWindows.some((item) => item.id === window.id)

            return (
              <button
                key={window.id}
                type="button"
                disabled={!canOffer || !isSelectable || isPending}
                onClick={() => setSelectedWindowId(window.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  isSelected && canOffer
                    ? 'border-primary bg-primary/5'
                    : 'border-border-light bg-hover/60',
                  (!canOffer || !isSelectable) && 'cursor-default',
                )}
              >
                <span className="text-sm font-medium leading-snug text-heading">
                  {formatWindow(window)}
                </span>
                <span className="shrink-0 text-[11px] font-semibold uppercase text-muted">
                  {window.status}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {activeCurrentMemberOffer && !need.isOwnedByCurrentMember && (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-primary">
              <Check size={16} className="shrink-0" />
              <span className="min-w-0">
                {activeCurrentMemberOffer.status === 'accepted'
                  ? 'You were accepted for this need.'
                  : 'Your offer is in the requester queue.'}
              </span>
            </div>
            {activeCurrentMemberOffer.status === 'offered' &&
              !isConfirmingWithdraw && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-error hover:bg-error/8"
                  disabled={isPending}
                  onClick={() => setIsConfirmingWithdraw(true)}
                >
                  Withdraw
                </Button>
              )}
          </div>
          {activeCurrentMemberOffer.status === 'offered' &&
            isConfirmingWithdraw && (
              <div className="space-y-2 rounded-lg bg-surface p-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Reason
                  <select
                    value={withdrawReason}
                    onChange={(event) =>
                      setWithdrawReason(event.target.value as CancellationReason)
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-border-light bg-page px-3 text-sm font-medium text-heading outline-none focus:ring-2 focus:ring-primary/20"
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
                    value={withdrawNote}
                    onChange={(event) => setWithdrawNote(event.target.value)}
                    rows={2}
                    maxLength={240}
                    className="mt-1 w-full resize-y rounded-lg border border-border-light bg-page px-3 py-2 text-sm normal-case tracking-normal text-body outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Add context for the requester."
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => setIsConfirmingWithdraw(false)}
                  >
                    Keep offer
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-error hover:bg-error/8"
                    isLoading={isPending}
                    onClick={handleWithdrawOffer}
                  >
                    Confirm withdraw
                  </Button>
                </div>
              </div>
          )}
        </div>
      )}

      {need.currentMemberOffer &&
        !activeCurrentMemberOffer &&
        !need.isOwnedByCurrentMember && (
          <div className="flex items-center gap-2 rounded-lg border border-border-light bg-hover/50 px-3 py-2.5 text-sm font-medium text-secondary">
            <Check size={16} className="shrink-0 text-muted" />
            {need.currentMemberOffer.status === 'withdrawn'
              ? 'You withdrew your offer.'
              : `Your offer is ${offerStatusLabel(need.currentMemberOffer).toLowerCase()}.`}
          </div>
        )}

      {canOffer && (
        <div className="space-y-2">
          <label className="block">
            <span className="sr-only">Optional note</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={2}
              maxLength={240}
              placeholder="Optional note, e.g. I can do the Tuesday window and bring tools."
              className="w-full resize-y rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            isLoading={isPending}
            onClick={handleOfferHelp}
          >
            <UserCheck size={16} />
            I can help
          </Button>
        </div>
      )}

      {need.isOwnedByCurrentMember && (
        <div className="space-y-2 rounded-lg border border-border-light bg-hover/50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageCircle size={15} className="text-primary" />
              <p className="text-sm font-semibold text-heading">Helper offers</p>
            </div>
            <span className="text-xs font-medium text-muted">
              {activeOfferCount} active
            </span>
          </div>

          {need.offers.length > 0 ? (
            <div className="space-y-2">
              {need.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar
                      src={offer.helper?.avatarUrl}
                      firstName={offer.helper?.firstName}
                      lastName={offer.helper?.lastName}
                      size="sm"
                      isAvailable={offer.helper?.isAvailable}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-heading">
                        {offer.helper
                          ? `${offer.helper.firstName} ${offer.helper.lastName}`
                          : 'Helper'}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {offer.message || offerStatusLabel(offer)}
                      </p>
                    </div>
                  </div>
                  {offer.status === 'offered' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={isPending}
                      onClick={() => handleAcceptOffer(offer.id)}
                    >
                      Accept
                    </Button>
                  ) : (
                    <Badge variant={offer.status === 'accepted' ? 'primary' : 'default'}>
                      {offerStatusLabel(offer)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              No helpers yet. This need will show to nearby members who match
              the category and timing.
            </p>
          )}
        </div>
      )}

      {(canCancelNeed || canRepostNeed || canMarkStillNeedsHelp) && (
        <div className="space-y-3 rounded-lg border border-border-light bg-surface px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-heading">Need status</p>
              <p className="text-xs text-muted">
                {isConfirmingCancel
                  ? 'Open helper offers will expire.'
                  : isRefreshed
                    ? 'Marked as still needing help.'
                  : 'Repost with fresh windows, or cancel when this request is no longer needed.'}
              </p>
            </div>
            {!isConfirmingCancel && (
              <div className="flex shrink-0 items-center gap-1.5">
                {canMarkStillNeedsHelp && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    isLoading={isPending}
                    onClick={handleStillNeedsHelp}
                  >
                    <UserCheck size={15} />
                    Still need help
                  </Button>
                )}
                {canRepostNeed && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    isLoading={isPending}
                    onClick={handleRepostNeed}
                  >
                    <RotateCcw size={15} />
                    Repost
                  </Button>
                )}
                {canCancelNeed && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-error hover:bg-error/8"
                    disabled={isPending}
                    onClick={() => setIsConfirmingCancel(true)}
                  >
                    <XCircle size={15} />
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
          {isConfirmingCancel && (
            <div className="space-y-2 rounded-lg bg-hover/60 p-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Reason
                <select
                  value={cancelReason}
                  onChange={(event) =>
                    setCancelReason(event.target.value as CancellationReason)
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-border-light bg-page px-3 text-sm font-medium text-heading outline-none focus:ring-2 focus:ring-primary/20"
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
                  rows={2}
                  maxLength={240}
                  className="mt-1 w-full resize-y rounded-lg border border-border-light bg-page px-3 py-2 text-sm normal-case tracking-normal text-body outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Add context for helpers who offered."
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
                  Keep need
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-error hover:bg-error/8"
                  isLoading={isPending}
                  onClick={handleCancelNeed}
                >
                  Confirm cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-error/15 bg-error/8 px-3 py-2.5">
          <AlertCircle size={16} className="shrink-0 text-error" />
          <p className="text-xs font-medium text-error">{error}</p>
        </div>
      )}
    </Card>
  )
}
