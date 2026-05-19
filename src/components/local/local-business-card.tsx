import Link from 'next/link'
import { HeartHandshake, MapPin, Star } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { formatBusinessCategory } from '@/lib/local-business'
import type { LocalBusiness } from '@/lib/exchange-engine'

function formatDistance(distanceMiles: number | null): string | null {
  return distanceMiles === null ? null : `${distanceMiles.toFixed(1)} mi`
}

export function LocalBusinessCard({
  business,
  source,
}: {
  business: LocalBusiness
  source?: 'fallback'
}) {
  const imageUrl = business.profile.photoUrls[0]
  const distance = formatDistance(business.distanceMiles)
  const primaryCategory = business.profile.categories[0]
  const href = source
    ? `/local/${business.profile.id}?source=${source}`
    : `/local/${business.profile.id}`

  return (
    <Link href={href} className="block">
      <Card noPadding className="overflow-hidden">
        <div className="relative h-36 bg-hover">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={business.profile.businessName}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
              <HeartHandshake size={34} />
            </div>
          )}
          {business.profile.isCommunityFavorite && (
            <Badge className="absolute left-2.5 top-2.5 bg-white/90 text-primary">
              Community Favorite
            </Badge>
          )}
        </div>

        <div className="space-y-2 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-heading">
                {business.profile.businessName}
              </h3>
              <p className="mt-0.5 text-xs text-secondary">
                {primaryCategory
                  ? formatBusinessCategory(primaryCategory)
                  : 'Local Business'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-center justify-end gap-1 text-xs font-semibold text-heading">
                <Star size={12} className="fill-warning text-warning" />
                {business.profile.rating.toFixed(1)}
              </div>
              <p className="text-[11px] text-muted">
                {business.profile.reviewCount} reviews
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{business.profile.serviceArea}</span>
            {distance && (
              <>
                <span className="shrink-0">&middot;</span>
                <span className="shrink-0 tabular-nums">{distance}</span>
              </>
            )}
          </div>

          {business.profile.contributionBadges.length > 0 && (
            <div className="flex gap-1.5 overflow-hidden">
              {business.profile.contributionBadges.slice(0, 2).map((badge) => (
                <span
                  key={badge}
                  className="truncate rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
