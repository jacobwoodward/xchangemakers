'use client'

import { useState, useTransition } from 'react'
import { Bell, Check, MapPin } from 'lucide-react'
import { saveOnboardingPreferencesAction } from '@/app/(auth)/onboarding/actions'
import type {
  HappeningCategory,
  IntentNotificationFrequency,
  ListingCategory,
  MemberIntentProfile,
} from '@/lib/exchange-engine/types'

const LISTING_OPTIONS: Array<{ value: ListingCategory; label: string }> = [
  { value: 'food', label: 'Food / meals' },
  { value: 'services', label: 'Errands / rides' },
  { value: 'skills', label: 'Skills / tutoring' },
  { value: 'classes', label: 'Classes' },
  { value: 'handmade', label: 'Handmade' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'tech', label: 'Tech help' },
  { value: 'home', label: 'Home / repairs' },
  { value: 'kids', label: 'Kids / family' },
  { value: 'other', label: 'Other' },
]

const HAPPENING_OPTIONS: Array<{ value: HappeningCategory; label: string }> = [
  { value: 'kids', label: 'Kids & family' },
  { value: 'food', label: 'Cooking / food' },
  { value: 'markets', label: 'Markets' },
  { value: 'fitness', label: 'Wellness / yoga' },
  { value: 'classes', label: 'Workshops' },
  { value: 'social', label: 'Social mixers' },
  { value: 'community', label: 'Volunteering' },
  { value: 'exchange_event', label: 'Exchange events' },
]

const RADIUS_OPTIONS = [1, 5, 10, 25]

const FREQUENCY_OPTIONS: Array<{
  value: IntentNotificationFrequency
  label: string
}> = [
  { value: 'immediate', label: 'Right away' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'off', label: 'Off' },
]

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

interface OptionButtonProps<T extends string> {
  selected: boolean
  value: T
  label: string
  onToggle: (value: T) => void
}

function OptionButton<T extends string>({
  selected,
  value,
  label,
  onToggle,
}: OptionButtonProps<T>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(value)}
      className={`flex min-h-11 items-center justify-between rounded-lg border px-3 text-left text-sm font-medium transition ${
        selected
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-surface text-secondary hover:border-primary/30 hover:text-heading'
      }`}
    >
      <span>{label}</span>
      {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
    </button>
  )
}

interface PreferenceCaptureProps {
  initialProfile: MemberIntentProfile
}

export function PreferenceCapture({ initialProfile }: PreferenceCaptureProps) {
  const [canHelpCategories, setCanHelpCategories] = useState(
    initialProfile.canHelpCategories,
  )
  const [needsHelpCategories, setNeedsHelpCategories] = useState(
    initialProfile.needsHelpCategories,
  )
  const [happeningInterests, setHappeningInterests] = useState(
    initialProfile.happeningInterests,
  )
  const [radiusMiles, setRadiusMiles] = useState(initialProfile.radiusMiles)
  const [notificationFrequency, setNotificationFrequency] = useState(
    initialProfile.notificationFrequency,
  )
  const [shareAvailability, setShareAvailability] = useState(
    initialProfile.shareAvailability,
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function savePreferences() {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await saveOnboardingPreferencesAction({
        canHelpCategories,
        needsHelpCategories,
        happeningInterests,
        radiusMiles,
        notificationFrequency,
        shareAvailability,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.profile) {
        setCanHelpCategories(result.profile.canHelpCategories)
        setNeedsHelpCategories(result.profile.needsHelpCategories)
        setHappeningInterests(result.profile.happeningInterests)
        setRadiusMiles(result.profile.radiusMiles)
        setNotificationFrequency(result.profile.notificationFrequency)
        setShareAvailability(result.profile.shareAvailability)
      }

      setMessage('Preferences saved')
    })
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Match setup
          </p>
          <h2 className="mt-1 text-lg font-semibold text-heading">
            Help and interest preferences
          </h2>
        </div>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-heading">
            I can help with
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {LISTING_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                {...option}
                selected={canHelpCategories.includes(option.value)}
                onToggle={(value) =>
                  setCanHelpCategories((current) => toggleValue(current, value))
                }
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-heading">
            I may need help with
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {LISTING_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                {...option}
                selected={needsHelpCategories.includes(option.value)}
                onToggle={(value) =>
                  setNeedsHelpCategories((current) => toggleValue(current, value))
                }
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-heading">
            Happenings I care about
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {HAPPENING_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                {...option}
                selected={happeningInterests.includes(option.value)}
                onToggle={(value) =>
                  setHappeningInterests((current) => toggleValue(current, value))
                }
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-heading">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              Distance
            </div>
            <div className="grid grid-cols-4 gap-2">
              {RADIUS_OPTIONS.map((radius) => (
                <button
                  key={radius}
                  type="button"
                  onClick={() => setRadiusMiles(radius)}
                  className={`min-h-10 rounded-lg border px-2 text-sm font-semibold transition ${
                    radiusMiles === radius
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-white text-secondary hover:border-primary/40'
                  }`}
                >
                  {radius} mi
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-heading">
              <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
              Notifications
            </div>
            <select
              value={notificationFrequency}
              onChange={(event) =>
                setNotificationFrequency(
                  event.target.value as IntentNotificationFrequency,
                )
              }
              className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-medium text-heading"
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-white px-3 text-sm font-medium text-heading">
          <input
            type="checkbox"
            checked={shareAvailability}
            onChange={(event) => setShareAvailability(event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Show my availability to neighbors
        </label>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="min-h-5 text-sm">
            {message && <span className="font-medium text-primary">{message}</span>}
            {error && <span className="font-medium text-danger">{error}</span>}
          </div>
          <button
            type="button"
            onClick={savePreferences}
            disabled={isPending}
            className="min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Saving...' : 'Save preferences'}
          </button>
        </div>
      </div>
    </section>
  )
}
