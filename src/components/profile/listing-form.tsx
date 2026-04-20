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

const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: 'food', label: 'Food' },
  { value: 'services', label: 'Services' },
  { value: 'skills', label: 'Skills' },
  { value: 'classes', label: 'Classes' },
  { value: 'handmade', label: 'Handmade' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'tech', label: 'Tech' },
  { value: 'home', label: 'Home' },
  { value: 'kids', label: 'Kids' },
  { value: 'other', label: 'Other' },
]

const AVAILABILITY_OPTIONS: { value: AvailabilityType; label: string; hint: string }[] = [
  { value: 'ongoing', label: 'Ongoing', hint: 'Available regularly' },
  { value: 'one_time', label: 'One-time', hint: 'Single occurrence' },
  { value: 'event_only', label: 'Event only', hint: 'Tied to an event' },
]

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
      router.push('/profile')
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
              Offering
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

      {/* Title */}
      <Card>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder={type === 'offering' ? 'e.g. Homemade sourdough loaf' : 'e.g. Need help moving furniture'}
            className="mt-1.5 w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
      </Card>

      {/* Description */}
      <Card>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Give your neighbors the details — what, when, how, anything special?"
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
          {CATEGORIES.map(({ value, label }) => (
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

      {/* Price in TU */}
      <Card>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Time cost
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
              <span className="text-xs font-semibold text-muted">TU</span>
            </div>
            <span className="text-xs text-muted">
              ≈ {creditPrice} {creditPrice === 1 ? 'hour' : 'hours'} of community time
            </span>
          </div>
        </label>
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
          {mode === 'create' ? 'Post' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
