'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CalendarDays, Image as ImageIcon, MapPin } from 'lucide-react'
import { createHappeningAction } from '@/app/(app)/happenings/actions'
import { Button, Card } from '@/components/ui'
import { formatHappeningCategory } from '@/lib/happenings'
import type { HappeningCategory } from '@/lib/exchange-engine'

const CATEGORY_OPTIONS: { label: string; value: HappeningCategory }[] = [
  { label: formatHappeningCategory('kids'), value: 'kids' },
  { label: formatHappeningCategory('food'), value: 'food' },
  { label: formatHappeningCategory('markets'), value: 'markets' },
  { label: formatHappeningCategory('fitness'), value: 'fitness' },
  { label: formatHappeningCategory('classes'), value: 'classes' },
  { label: formatHappeningCategory('social'), value: 'social' },
  { label: formatHappeningCategory('community'), value: 'community' },
  { label: formatHappeningCategory('exchange_event'), value: 'exchange_event' },
]

function inputDateValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function defaultTimes(): { start: string; end: string } {
  const start = new Date()
  start.setDate(start.getDate() + 1)
  start.setHours(18, 0, 0, 0)

  const end = new Date(start)
  end.setMinutes(end.getMinutes() + 90)

  return {
    start: inputDateValue(start),
    end: inputDateValue(end),
  }
}

export function HappeningForm() {
  const router = useRouter()
  const defaults = useMemo(defaultTimes, [])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<HappeningCategory>('community')
  const [location, setLocation] = useState('')
  const [startAt, setStartAt] = useState(defaults.start)
  const [endAt, setEndAt] = useState(defaults.end)
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const created = await createHappeningAction({
          title,
          description,
          category,
          location,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          imageUrl: imageUrl.trim() || null,
        })
        router.push(`/happenings/${created.id}`)
        router.refresh()
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : 'Unable to create event.',
        )
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-error/15 bg-error/8 px-3 py-2.5">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-error" />
          <p className="text-sm font-medium text-error">{error}</p>
        </div>
      )}

      <Card className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-heading">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
            className="h-11 w-full rounded-lg border border-border-light bg-page px-3 text-sm text-body outline-none focus:border-primary"
            placeholder="Garden Club Meetup"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-heading">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as HappeningCategory)}
            className="h-11 w-full rounded-lg border border-border-light bg-page px-3 text-sm font-semibold text-body outline-none focus:border-primary"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-heading">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={700}
            required
            rows={5}
            className="w-full rounded-lg border border-border-light bg-page px-3 py-2.5 text-sm leading-relaxed text-body outline-none focus:border-primary"
            placeholder="All are welcome. No experience needed."
          />
        </label>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={17} className="text-primary" />
          <h2 className="text-sm font-semibold text-heading">When</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-heading">Starts</span>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              required
              className="h-11 w-full rounded-lg border border-border-light bg-page px-3 text-sm text-body outline-none focus:border-primary"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-heading">Ends</span>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
              required
              className="h-11 w-full rounded-lg border border-border-light bg-page px-3 text-sm text-body outline-none focus:border-primary"
            />
          </label>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={17} className="text-primary" />
          <h2 className="text-sm font-semibold text-heading">Where</h2>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-heading">Location</span>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            maxLength={220}
            required
            className="h-11 w-full rounded-lg border border-border-light bg-page px-3 text-sm text-body outline-none focus:border-primary"
            placeholder="Green Leaf Park"
          />
        </label>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon size={17} className="text-primary" />
          <h2 className="text-sm font-semibold text-heading">Image</h2>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-heading">Image URL</span>
          <input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            type="url"
            className="h-11 w-full rounded-lg border border-border-light bg-page px-3 text-sm text-body outline-none focus:border-primary"
            placeholder="https://..."
          />
        </label>
      </Card>

      <div className="sticky bottom-20 z-10 rounded-xl bg-page/90 py-3 backdrop-blur">
        <Button type="submit" size="lg" className="w-full" isLoading={isPending}>
          <CalendarDays size={18} />
          Create Event
        </Button>
      </div>
    </form>
  )
}
