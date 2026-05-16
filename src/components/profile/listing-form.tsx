'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Clock } from 'lucide-react'
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
  const guidance = LISTING_FORM_GUIDANCE[type]
  const creditSuggestions = CREDIT_SUGGESTIONS[type]

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !isPending

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
      router.push(
        mode === 'create' && result.id
          ? `/listing/${result.id}/matches`
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
          {mode === 'create' ? 'Post and match' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
