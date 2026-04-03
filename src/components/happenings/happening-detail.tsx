import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, MapPin } from 'lucide-react'
import { Badge, Avatar } from '@/components/ui'
import type { Happening, HappeningCategory, Member } from '@/lib/exchange-engine/types'

// ---------------------------------------------------------------------------
// Category visual config
// ---------------------------------------------------------------------------

const CATEGORY_GRADIENTS: Record<HappeningCategory, string> = {
  kids: 'from-purple-300 to-violet-400',
  food: 'from-orange-300 to-amber-500',
  markets: 'from-emerald-300 to-green-400',
  fitness: 'from-teal-300 to-cyan-500',
  classes: 'from-blue-300 to-indigo-500',
  social: 'from-pink-300 to-rose-400',
  community: 'from-amber-300 to-yellow-500',
  exchange_event: 'from-green-500 to-emerald-700',
}

const CATEGORY_LABELS: Record<HappeningCategory, string> = {
  kids: 'Kids',
  food: 'Food',
  markets: 'Markets',
  fitness: 'Fitness',
  classes: 'Classes',
  social: 'Social',
  community: 'Community',
  exchange_event: 'Exchange Event',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, "EEEE, MMMM d, yyyy '\u00B7' h:mm a")
}

function formatTimeRange(startStr: string, endStr: string): string {
  const start = new Date(startStr)
  const end = new Date(endStr)
  return `${format(start, "EEEE, MMMM d '\u00B7' h:mm a")} \u2013 ${format(end, 'h:mm a')}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HappeningDetailProps {
  happening: Happening
  attendees?: Member[]
}

export function HappeningDetail({ happening, attendees = [] }: HappeningDetailProps) {
  const host = happening.host

  return (
    <div className="space-y-5">
      {/* ─── Hero ─── */}
      <div className="relative -mx-4">
        {happening.imageUrl ? (
          <img
            src={happening.imageUrl}
            alt={happening.title}
            className="h-[200px] w-full object-cover"
            draggable={false}
          />
        ) : (
          <div
            className={`h-[200px] w-full bg-gradient-to-br ${CATEGORY_GRADIENTS[happening.category]} flex items-center justify-center`}
          >
            <span className="text-4xl text-white/20 font-bold">
              {CATEGORY_LABELS[happening.category]}
            </span>
          </div>
        )}

        {/* Category badge overlaid */}
        <Badge
          variant="default"
          className="absolute bottom-3 left-4 bg-white/90 text-body backdrop-blur-sm"
        >
          {CATEGORY_LABELS[happening.category]}
        </Badge>
      </div>

      {/* ─── Title ─── */}
      <h1 className="text-xl font-bold tracking-tight text-heading leading-snug">
        {happening.title}
      </h1>

      {/* ─── Date/Time ─── */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--xm-bg-hover)' }}
        >
          <Calendar size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-heading">
            {formatTimeRange(happening.startAt, happening.endAt)}
          </p>
        </div>
      </div>

      {/* ─── Location ─── */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--xm-bg-hover)' }}
        >
          <MapPin size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-heading">
            {happening.location}
          </p>
        </div>
      </div>

      {/* ─── Host ─── */}
      {host && (
        <Link
          href={`/member/${host.id}`}
          className="flex items-center gap-3 rounded-lg p-3 -mx-1 transition-colors hover:bg-hover"
        >
          <Avatar
            src={host.avatarUrl}
            firstName={host.firstName}
            lastName={host.lastName}
            size="md"
            isAvailable={host.isAvailable}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">Hosted by</p>
            <p className="text-sm font-semibold text-heading">
              {host.firstName} {host.lastName}
            </p>
          </div>
          <span className="text-xs font-medium text-primary">
            View profile
          </span>
        </Link>
      )}

      {/* ─── Description ─── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          About this event
        </h3>
        <p className="text-sm text-body leading-relaxed whitespace-pre-line">
          {happening.description}
        </p>
      </div>

      {/* ─── Attendees preview ─── */}
      {attendees.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Who&rsquo;s going
          </h3>
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {attendees.slice(0, 8).map((member) => (
                <div
                  key={member.id}
                  className="ring-2 ring-surface rounded-full"
                >
                  <Avatar
                    src={member.avatarUrl}
                    firstName={member.firstName}
                    lastName={member.lastName}
                    size="sm"
                  />
                </div>
              ))}
            </div>
            {attendees.length > 8 && (
              <span className="ml-2 text-xs text-muted">
                +{attendees.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
