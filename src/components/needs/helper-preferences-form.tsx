'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Clock3, MapPin, Save, SlidersHorizontal } from 'lucide-react'
import { updateHelperPreferencesAction } from '@/app/(app)/needs/actions'
import { Badge, Button, Card } from '@/components/ui'
import { LISTING_CATEGORIES, formatCategory } from '@/lib/marketplace'
import { cn } from '@/lib/utils'
import type {
  HelperDigestFrequency,
  HelperPreferences,
  ListingCategory,
} from '@/lib/exchange-engine'

const RADIUS_OPTIONS = [1, 5, 10, 25]
const DIGEST_OPTIONS: {
  value: HelperDigestFrequency
  label: string
}[] = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'off', label: 'Off' },
]

export function HelperPreferencesForm({
  preferences,
}: {
  preferences: HelperPreferences
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState<ListingCategory[]>(
    preferences.categories,
  )
  const [radiusMiles, setRadiusMiles] = useState(preferences.radiusMiles)
  const [urgentOnly, setUrgentOnly] = useState(preferences.urgentOnly)
  const [digestFrequency, setDigestFrequency] =
    useState<HelperDigestFrequency>(preferences.digestFrequency)
  const [quietHoursStart, setQuietHoursStart] = useState(
    preferences.quietHoursStart ?? '',
  )
  const [quietHoursEnd, setQuietHoursEnd] = useState(
    preferences.quietHoursEnd ?? '',
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const categorySummary =
    categories.length === 0
      ? 'All categories'
      : categories.length === 1
        ? formatCategory(categories[0])
        : `${categories.length} categories`

  function toggleCategory(category: ListingCategory) {
    setSaved(false)
    setCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    )
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updateHelperPreferencesAction({
        categories,
        radiusMiles,
        urgentOnly,
        digestFrequency,
        quietHoursStart: quietHoursStart || null,
        quietHoursEnd: quietHoursEnd || null,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.preferences) {
        setCategories(result.preferences.categories)
        setRadiusMiles(result.preferences.radiusMiles)
        setUrgentOnly(result.preferences.urgentOnly)
        setDigestFrequency(result.preferences.digestFrequency)
        setQuietHoursStart(result.preferences.quietHoursStart ?? '')
        setQuietHoursEnd(result.preferences.quietHoursEnd ?? '')
      }

      setSaved(true)
      router.refresh()
    })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-heading">
                I can help with
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              Categories, distance, and alerts for matching timed needs.
            </p>
          </div>
          <Badge variant="outline">{categorySummary}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Check size={14} />
            I can help with
          </div>
          <div className="flex flex-wrap gap-2">
            {LISTING_CATEGORIES.map((category) => {
              const isSelected = categories.includes(category.value)

              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => toggleCategory(category.value)}
                  className={cn(
                    'inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border-light bg-surface text-secondary hover:bg-hover',
                  )}
                >
                  {category.label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setSaved(false)
              setCategories([])
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Use all categories
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <MapPin size={14} />
            Location radius
          </div>
          <div className="grid grid-cols-4 gap-2">
            {RADIUS_OPTIONS.map((radius) => (
              <button
                key={radius}
                type="button"
                onClick={() => {
                  setSaved(false)
                  setRadiusMiles(radius)
                }}
                className={cn(
                  'h-10 rounded-lg border text-sm font-semibold transition-colors',
                  radiusMiles === radius
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-light bg-surface text-secondary hover:bg-hover',
                )}
              >
                {radius} mi
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Bell size={14} />
            Alerts
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border-light bg-hover/50 px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-heading">
                Urgent only
              </p>
              <p className="text-xs text-muted">
                Only notify me when help is needed now.
              </p>
            </div>
            <input
              type="checkbox"
              checked={urgentOnly}
              onChange={(event) => {
                setSaved(false)
                setUrgentOnly(event.target.checked)
              }}
              className="h-5 w-5 rounded border-border text-primary"
            />
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DIGEST_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSaved(false)
                  setDigestFrequency(option.value)
                }}
                className={cn(
                  'h-10 rounded-lg border px-2 text-xs font-semibold transition-colors',
                  digestFrequency === option.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-light bg-surface text-secondary hover:bg-hover',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-border-light bg-hover/50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Clock3 size={14} />
              Quiet hours
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-secondary">
                  Start
                </span>
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={(event) => {
                    setSaved(false)
                    setQuietHoursStart(event.target.value)
                  }}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm font-medium text-heading outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-secondary">
                  End
                </span>
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(event) => {
                    setSaved(false)
                    setQuietHoursEnd(event.target.value)
                  }}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm font-medium text-heading outline-none focus:border-primary"
                />
              </label>
            </div>
            {(quietHoursStart || quietHoursEnd) && (
              <button
                type="button"
                onClick={() => {
                  setSaved(false)
                  setQuietHoursStart('')
                  setQuietHoursEnd('')
                }}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
              >
                Clear quiet hours
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-error/15 bg-error/8 px-3 py-2 text-xs font-medium text-error">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="flex-1"
            isLoading={isPending}
          >
            <Save size={16} />
            Save preferences
          </Button>
          {saved && (
            <span className="text-xs font-semibold text-primary">Saved</span>
          )}
        </div>
      </form>
    </Card>
  )
}
