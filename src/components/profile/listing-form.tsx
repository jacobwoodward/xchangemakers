'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CalendarClock,
  Clock,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type {
  AvailabilityType,
  ListingCategory,
  ListingType,
  CreateListingInput,
} from '@/lib/exchange-engine'
import {
  createListingAction,
  updateListingAction,
} from '@/app/(app)/profile/listing/actions'
import { AVAILABILITY_OPTIONS, LISTING_CATEGORIES } from '@/lib/marketplace'

const LISTING_FORM_GUIDANCE: Record<
  ListingType,
  {
    badge: string
    heading: string
    copy: string
    titleLabel: string
    titlePlaceholder: string
    descriptionLabel: string
    descriptionPlaceholder: string
    detailPrompts: string[]
  }
> = {
  offering: {
    badge: 'Offer',
    heading: 'Make it easy to say yes',
    copy: 'Describe the outcome, what is included, and when you are usually available.',
    titleLabel: 'What can you offer?',
    titlePlaceholder: 'e.g. Homemade sourdough loaf',
    descriptionLabel: 'What should neighbors expect?',
    descriptionPlaceholder:
      'Include what is included, how much notice you need, where it happens, and what a good exchange looks like.',
    detailPrompts: [
      'What is included',
      'Where or how it happens',
      'How much notice you need',
    ],
  },
  need: {
    badge: 'Need',
    heading: 'Ask for a concrete outcome',
    copy: 'Be specific about the help you need, when it matters, and what would make the exchange feel complete.',
    titleLabel: 'What do you need help with?',
    titlePlaceholder: 'e.g. Need help moving furniture',
    descriptionLabel: 'What would help look like?',
    descriptionPlaceholder:
      'Include the task, timing, location or constraints, and what someone should know before responding.',
    detailPrompts: [
      'What needs to happen',
      'When you need it',
      'Any constraints or supplies',
    ],
  },
}

const CREDIT_SUGGESTIONS: Record<
  ListingType,
  { label: string; value: number; hint: string }[]
> = {
  offering: [
    { label: 'Open', value: 0, hint: 'Let neighbors suggest' },
    { label: '1 credit', value: 1, hint: 'Quick favor' },
    { label: '2 credits', value: 2, hint: 'Focused help' },
    { label: '3 credits', value: 3, hint: 'Bigger task' },
  ],
  need: [
    { label: 'Open', value: 0, hint: 'Not sure yet' },
    { label: '1 credit', value: 1, hint: 'Quick help' },
    { label: '2 credits', value: 2, hint: 'Clear task' },
    { label: '3 credits', value: 3, hint: 'More involved' },
  ],
}

function toDateTimeInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

type NeedWindowFormState = {
  id: string
  sourceId?: string | null
  startsAt: string
  endsAt: string
  label: string
  isFlexible: boolean
}

function createWindowId(): string {
  return `window-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeDateTimeInputValue(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return toDateTimeInputValue(date)
}

function getDefaultNeedWindow(index = 0): NeedWindowFormState {
  const startsAt = new Date()
  startsAt.setDate(startsAt.getDate() + 1 + index)
  startsAt.setHours(index === 0 ? 14 : 10, 0, 0, 0)

  const endsAt = new Date(startsAt)
  endsAt.setHours(startsAt.getHours() + 2, 0, 0, 0)

  return {
    id: createWindowId(),
    startsAt: toDateTimeInputValue(startsAt),
    endsAt: toDateTimeInputValue(endsAt),
    label: index === 0 ? 'Preferred window' : 'Backup window',
    isFlexible: index > 0,
  }
}

export interface ListingFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<CreateListingInput>
  listingId?: string
  defaultType?: ListingType
}

export function ListingForm({
  mode,
  initialValues,
  listingId,
  defaultType = 'offering',
}: ListingFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<ListingType>(initialValues?.type ?? defaultType)
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [category, setCategory] = useState<ListingCategory>(
    initialValues?.category ?? 'services',
  )
  const [creditPrice, setCreditPrice] = useState<number>(
    initialValues?.creditPrice ?? 1,
  )
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>(
    initialValues?.availabilityType ?? 'ongoing',
  )
  const [needWindows, setNeedWindows] = useState<NeedWindowFormState[]>(() => {
    if (initialValues?.windows && initialValues.windows.length > 0) {
      return initialValues.windows.map((window, index) => ({
        id: `initial-${index}-${window.startsAt}`,
        sourceId: window.id ?? null,
        startsAt: normalizeDateTimeInputValue(window.startsAt),
        endsAt: normalizeDateTimeInputValue(window.endsAt),
        label: window.label ?? (index === 0 ? 'Preferred window' : 'Backup window'),
        isFlexible: Boolean(window.isFlexible),
      }))
    }
    return [getDefaultNeedWindow()]
  })
  const [publicLocationLabel, setPublicLocationLabel] = useState(
    initialValues?.publicLocationLabel ?? '',
  )
  const [isUrgent, setIsUrgent] = useState(initialValues?.isUrgent ?? false)
  const [recurringNote, setRecurringNote] = useState(
    initialValues?.recurringNote ?? '',
  )
  const guidance = LISTING_FORM_GUIDANCE[type]
  const creditSuggestions = CREDIT_SUGGESTIONS[type]

  const hasValidNeedWindow =
    type !== 'need' ||
    (needWindows.length > 0 &&
      needWindows.every(
        (window) =>
          window.startsAt.length > 0 &&
          window.endsAt.length > 0 &&
          new Date(window.endsAt) > new Date(window.startsAt),
      ))

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    hasValidNeedWindow &&
    !isPending

  const updateNeedWindow = (
    id: string,
    patch: Partial<Omit<NeedWindowFormState, 'id'>>,
  ) => {
    setNeedWindows((windows) =>
      windows.map((window) =>
        window.id === id ? { ...window, ...patch } : window,
      ),
    )
  }

  const addNeedWindow = () => {
    setNeedWindows((windows) => [
      ...windows,
      getDefaultNeedWindow(windows.length),
    ])
  }

  const removeNeedWindow = (id: string) => {
    setNeedWindows((windows) =>
      windows.length > 1 ? windows.filter((window) => window.id !== id) : windows,
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const payload: CreateListingInput = {
      type,
      title: title.trim(),
      description: description.trim(),
      category,
      creditPrice,
      availabilityType,
      publicLocationLabel:
        type === 'need' && publicLocationLabel.trim().length > 0
          ? publicLocationLabel.trim()
          : null,
      isUrgent: type === 'need' ? isUrgent : false,
      recurringNote:
        type === 'need' && recurringNote.trim().length > 0
          ? recurringNote.trim()
          : null,
      windows:
        type === 'need'
          ? needWindows.map((window, index) => ({
              id: window.sourceId ?? null,
              startsAt: window.startsAt,
              endsAt: window.endsAt,
              label:
                window.label.trim().length > 0
                  ? window.label.trim()
                  : index === 0
                    ? 'Preferred window'
                    : 'Backup window',
              isFlexible: window.isFlexible,
            }))
          : undefined,
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createListingAction(payload)
          : await updateListingAction(listingId!, payload)

      if (result.error) {
        setError(result.error)
        return
      }
      const createTarget =
        type === 'need' ? `/needs?posted=${result.id}` : `/listing/${result.id}/matches`
      router.push(
        mode === 'create' && result.id
          ? createTarget
          : '/profile',
      )
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type toggle — only for create */}
      {mode === 'create' && (
        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Type
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('offering')}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                type === 'offering'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-surface text-body border-border-light hover:bg-hover',
              )}
            >
              Offer
            </button>
            <button
              type="button"
              onClick={() => setType('need')}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                type === 'need'
                  ? 'bg-accent text-primary-foreground border-accent'
                  : 'bg-surface text-body border-border-light hover:bg-hover',
              )}
            >
              Need
            </button>
          </div>
        </Card>
      )}

      {mode === 'create' && (
        <Card className="space-y-3">
          <Badge variant={type === 'need' ? 'accent' : 'primary'}>
            {guidance.badge}
          </Badge>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-heading">
              {guidance.heading}
            </h3>
            <p className="text-xs leading-relaxed text-muted">
              {guidance.copy}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {guidance.detailPrompts.map((prompt) => (
              <div
                key={prompt}
                className="rounded-lg border border-border-light bg-hover px-2.5 py-2 text-[11px] font-medium leading-snug text-secondary"
              >
                {prompt}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Title */}
      <Card>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {guidance.titleLabel}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder={guidance.titlePlaceholder}
            className="mt-1.5 w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
      </Card>

      {/* Description */}
      <Card>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {guidance.descriptionLabel}
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={guidance.descriptionPlaceholder}
            className="mt-1.5 w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          />
        </label>
      </Card>

      {type === 'need' && (
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} className="text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Timing
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Add every window that could work so helpers can offer the slot
                that fits them.
              </p>
            </div>
            <button
              type="button"
              onClick={addNeedWindow}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <Plus size={14} />
              Add time
            </button>
          </div>

          <div className="space-y-3">
            {needWindows.map((window, index) => {
              const isInvalid =
                window.startsAt.length > 0 &&
                window.endsAt.length > 0 &&
                new Date(window.endsAt) <= new Date(window.startsAt)

              return (
                <div
                  key={window.id}
                  className="rounded-lg border border-border-light bg-hover/40 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Window {index + 1}
                    </p>
                    {needWindows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNeedWindow(window.id)}
                        className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface hover:text-error"
                        aria-label={`Remove window ${index + 1}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <label className="mt-2 block">
                    <span className="text-xs font-semibold text-muted">
                      Label
                    </span>
                    <input
                      type="text"
                      value={window.label}
                      onChange={(e) =>
                        updateNeedWindow(window.id, { label: e.target.value })
                      }
                      maxLength={80}
                      placeholder={
                        index === 0 ? 'Preferred window' : 'Backup window'
                      }
                      className="mt-1.5 w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </label>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-muted">
                        Starts
                      </span>
                      <input
                        type="datetime-local"
                        value={window.startsAt}
                        onChange={(e) =>
                          updateNeedWindow(window.id, {
                            startsAt: e.target.value,
                          })
                        }
                        className="mt-1.5 w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-muted">
                        Ends
                      </span>
                      <input
                        type="datetime-local"
                        value={window.endsAt}
                        onChange={(e) =>
                          updateNeedWindow(window.id, {
                            endsAt: e.target.value,
                          })
                        }
                        className="mt-1.5 w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                  </div>

                  <label className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border-light bg-surface px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-heading">
                        Flexible window
                      </p>
                      <p className="text-xs text-muted">
                        Helpers can suggest a nearby time.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={window.isFlexible}
                      onChange={(e) =>
                        updateNeedWindow(window.id, {
                          isFlexible: e.target.checked,
                        })
                      }
                      className="h-5 w-5 rounded border-border text-primary"
                    />
                  </label>

                  {isInvalid && (
                    <p className="mt-2 text-xs font-medium text-error">
                      End time must be after start time.
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {!hasValidNeedWindow && (
            <p className="text-xs font-medium text-error">
              Every need needs at least one valid time window.
            </p>
          )}

          <label className="flex items-center justify-between gap-3 rounded-lg border border-border-light px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-heading">
                Needs help right now
              </p>
              <p className="text-xs text-muted">
                Prioritize this in the urgent lane.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="h-5 w-5 rounded border-border text-primary"
            />
          </label>
        </Card>
      )}

      {type === 'need' && (
        <Card className="space-y-4">
          <div>
            <label className="block">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <MapPin size={14} />
                Public location
              </span>
              <input
                type="text"
                value={publicLocationLabel}
                onChange={(e) => setPublicLocationLabel(e.target.value)}
                maxLength={255}
                placeholder="e.g. Green Leaf Park area or Friendswood west side"
                className="mt-1.5 w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Helpers see the general area first. Exact addresses stay private
              until you accept someone.
            </p>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Recurring or backup notes
            </span>
            <textarea
              value={recurringNote}
              onChange={(e) => setRecurringNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Could become weekly, or backup times are okay if needed."
              className="mt-1.5 w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </label>
        </Card>
      )}

      {/* Category */}
      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Category
        </h3>
        <div className="flex flex-wrap gap-2">
          {LISTING_CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                category === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-hover text-secondary hover:bg-active',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Credit amount */}
      <Card>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Credit amount
          </span>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border-light bg-surface px-3 py-2.5 w-32">
              <Clock size={16} className="text-primary" />
              <input
                type="number"
                min={0}
                step={1}
                value={creditPrice}
                onChange={(e) => setCreditPrice(Math.max(0, Number(e.target.value)))}
                className="w-full bg-transparent text-sm font-semibold text-body focus:outline-none tabular-nums"
              />
              <span className="text-xs font-semibold text-muted">cr</span>
            </div>
            <span className="text-xs text-muted">
              {creditPrice === 0
                ? 'Let neighbors suggest a fair amount'
                : `${creditPrice} ${creditPrice === 1 ? 'credit' : 'credits'}`}
            </span>
          </div>
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {creditSuggestions.map((suggestion) => (
            <button
              key={`${suggestion.label}-${suggestion.value}`}
              type="button"
              onClick={() => setCreditPrice(suggestion.value)}
              className={cn(
                'rounded-lg border px-3 py-2 text-left transition-colors',
                creditPrice === suggestion.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border-light bg-surface hover:bg-hover',
              )}
            >
              <span className="block text-xs font-semibold text-heading">
                {suggestion.label}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted">
                {suggestion.hint}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Availability */}
      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Availability
        </h3>
        <div className="space-y-2">
          {AVAILABILITY_OPTIONS.map(({ value, label, hint }) => (
            <button
              key={value}
              type="button"
              onClick={() => setAvailabilityType(value)}
              className={cn(
                'w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                availabilityType === value
                  ? 'border-primary bg-primary/5'
                  : 'border-border-light bg-surface hover:bg-hover',
              )}
            >
              <div>
                <p className="text-sm font-semibold text-heading">{label}</p>
                <p className="text-xs text-muted">{hint}</p>
              </div>
              {availabilityType === value && (
                <Badge variant="primary" className="text-[10px]">
                  Selected
                </Badge>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-error/8 border border-error/15">
          <AlertCircle size={16} className="text-error shrink-0" />
          <p className="text-xs text-error font-medium">{error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="flex-1"
          disabled={!canSubmit}
          isLoading={isPending}
        >
          {mode === 'create'
            ? type === 'need'
              ? 'Post need'
              : 'Post and match'
            : 'Save'}
        </Button>
      </div>
    </form>
  )
}
