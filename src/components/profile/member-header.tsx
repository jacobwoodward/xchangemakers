import { Avatar, Badge } from '@/components/ui'
import type { MemberWithDetails } from '@/lib/exchange-engine'
import { MapPin, ShieldCheck, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemberHeaderProps {
  member: MemberWithDetails
}

/**
 * Deterministic mock distance derived from member coordinates.
 * Keeps the prototype feeling real without actual geolocation.
 */
function getMockDistance(lat: number, lng: number): string {
  const hash = Math.abs(Math.round((lat * 1000 + lng * 100) % 97))
  const miles = 0.1 + (hash % 30) / 10
  return `${miles.toFixed(1)} mi`
}

/** Visual trust bar — horizontal bar that fills proportionally to score. */
function TrustBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <ShieldCheck size={14} className="shrink-0 text-primary" />
      <div className="flex-1 h-1.5 rounded-full bg-border-light overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted tabular-nums shrink-0">
        {score}%
      </span>
    </div>
  )
}

export function MemberHeader({ member }: MemberHeaderProps) {
  const distance = getMockDistance(member.latitude, member.longitude)
  const isBusiness = member.membershipType === 'business'

  return (
    <div className="flex flex-col items-center text-center">
      {/* Avatar */}
      <Avatar
        src={member.avatarUrl}
        firstName={member.firstName}
        lastName={member.lastName}
        size="xl"
        isAvailable={member.isAvailable}
      />

      {/* Name */}
      <h2 className="mt-3 text-xl font-bold tracking-tight text-heading">
        {member.firstName} {member.lastName}
      </h2>

      {/* Vibe tagline */}
      {member.vibe && (
        <p className="mt-0.5 text-sm italic text-muted leading-snug max-w-[260px]">
          &ldquo;{member.vibe}&rdquo;
        </p>
      )}

      {/* Neighborhood + distance */}
      <div className="mt-2 flex items-center gap-1.5">
        <MapPin size={13} className="text-secondary" />
        <span className="text-xs font-medium text-secondary">
          {member.neighborhood}
        </span>
        <span className="text-xs text-muted">&middot;</span>
        <span className="text-xs text-muted tabular-nums">{distance}</span>
      </div>

      {/* Business badge */}
      {isBusiness && (
        <Badge variant="accent" className="mt-2 gap-1">
          <Store size={11} />
          Shop Local
        </Badge>
      )}

      {/* Trust score bar */}
      <div className="mt-4 w-full max-w-[220px]">
        <TrustBar score={member.trustScore} />
      </div>

      {/* Bio */}
      {member.bio && (
        <p className="mt-4 text-sm text-body leading-relaxed max-w-[320px]">
          {member.bio}
        </p>
      )}
    </div>
  )
}
