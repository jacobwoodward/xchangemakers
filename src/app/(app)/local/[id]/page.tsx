export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  Globe,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShoppingBag,
  Star,
} from 'lucide-react'
import { PageTransition } from '@/components/shared/page-transition'
import { SaveLocalBusinessButton } from '@/components/local/save-local-business-button'
import { Badge, Card } from '@/components/ui'
import { exchangeEngine } from '@/lib/exchange-engine'
import { formatBusinessCategory } from '@/lib/local-business'
import type { BusinessCategory } from '@/lib/exchange-engine'

function formatDistance(distanceMiles: number | null): string | null {
  return distanceMiles === null ? null : `${distanceMiles.toFixed(1)} mi`
}

function formatPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

function ActionLink({
  href,
  children,
  external = false,
}: {
  href: string
  children: React.ReactNode
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="flex h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-border-light bg-surface px-2 text-center text-xs font-semibold text-heading"
    >
      {children}
    </Link>
  )
}

export default async function LocalBusinessDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const sourceParams = await searchParams
  await exchangeEngine.initialize()

  const business = await exchangeEngine.getLocalBusiness(id).catch(() => null)
  if (!business) notFound()

  const { profile, offerings } = business
  const source = Array.isArray(sourceParams.source)
    ? sourceParams.source[0]
    : sourceParams.source
  if (source === 'fallback') {
    await exchangeEngine.trackAnalyticsEvent({
      eventType: 'business_fallback_clicked',
      targetType: 'business_profile',
      targetId: profile.id,
      metadata: {
        businessName: profile.businessName,
        categories: profile.categories,
      },
    })
  }
  const imageUrl = profile.photoUrls[0]
  const distance = formatDistance(business.distanceMiles)
  const categoryLabels = profile.categories
    .map((category: BusinessCategory) => formatBusinessCategory(category))
    .join(' • ')
  const hoursEntries = Object.entries(profile.hours)

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/local"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-heading shadow-card"
            aria-label="Back to local businesses"
          >
            <ArrowLeft size={18} />
          </Link>
          <SaveLocalBusinessButton />
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <HeartHandshake size={28} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Badge variant="primary">Shop Local</Badge>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-heading">
              {profile.businessName}
            </h1>
            <p className="mt-1 text-sm text-secondary">{categoryLabels}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1 font-semibold text-heading">
                <Star size={13} className="fill-warning text-warning" />
                {profile.rating.toFixed(1)}
              </span>
              <span>{profile.reviewCount} reviews</span>
              {distance && <span>{distance}</span>}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-hover">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={profile.businessName}
              className="h-52 w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-52 items-center justify-center text-primary">
              <ShoppingBag size={38} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {profile.phone && (
            <ActionLink href={formatPhoneHref(profile.phone)}>
              <Phone size={18} className="text-primary" />
              Call
            </ActionLink>
          )}
          {profile.websiteUrl && (
            <ActionLink href={profile.websiteUrl} external>
              <Globe size={18} className="text-primary" />
              Website
            </ActionLink>
          )}
          <ActionLink href={profile.directionsUrl ?? '#'} external={Boolean(profile.directionsUrl)}>
            <Navigation size={18} className="text-primary" />
            Directions
          </ActionLink>
          <ActionLink href="/messages">
            <MessageCircle size={18} className="text-primary" />
            Message
          </ActionLink>
        </div>

        <Card className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-heading">About</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              {business.member.bio ?? profile.contributionNotes}
            </p>
          </div>

          {profile.contributionNotes && (
            <div className="rounded-lg bg-primary/10 p-3">
              <div className="flex items-start gap-2">
                <HeartHandshake size={18} className="mt-0.5 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-heading">
                    This business gives back
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-secondary">
                    {profile.contributionNotes}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 border-t border-border-light pt-4">
            <div className="flex items-start gap-3">
              <ShoppingBag size={17} className="mt-0.5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-heading">
                  Products & services
                </p>
                <p className="mt-1 text-xs leading-relaxed text-secondary">
                  {offerings.length > 0
                    ? offerings.slice(0, 3).map((offering) => offering.title).join(', ')
                    : categoryLabels}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={17} className="mt-0.5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-heading">Location</p>
                <p className="mt-1 text-xs leading-relaxed text-secondary">
                  {profile.address}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarClock size={17} className="mt-0.5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-heading">
                  Community love
                </p>
                <p className="mt-1 text-xs leading-relaxed text-secondary">
                  {profile.communityHoursContributed} hours contributed
                </p>
              </div>
            </div>
          </div>
        </Card>

        {hoursEntries.length > 0 && (
          <Card className="space-y-3">
            <h2 className="text-sm font-bold text-heading">Hours</h2>
            <div className="grid gap-2">
              {hoursEntries.map(([day, hours]) => (
                <div
                  key={day}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="font-medium text-heading">{day}</span>
                  <span className="text-secondary">{hours}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Link
          href="/local"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-light bg-surface px-4 py-3 text-sm font-semibold text-primary"
        >
          <ExternalLink size={16} />
          View more local options
        </Link>
      </div>
    </PageTransition>
  )
}
