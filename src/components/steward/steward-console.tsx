import Link from 'next/link'
import {
  AlertTriangle,
  CalendarX,
  CheckCircle2,
  CircleDollarSign,
  Flag,
  Handshake,
  HeartPulse,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import type {
  CommunityInvite,
  Exchange,
  Happening,
  Listing,
  Member,
  StewardDashboard,
  StewardFlag,
  StewardMatchAssist,
} from '@/lib/exchange-engine'
import {
  archiveListingAction,
  deletePastHappeningAction,
  refreshListingAction,
  resolveDisputeAction,
  resolveFlagAction,
  setMemberStatusAction,
} from '@/app/(app)/steward/actions'

function formatDate(value: string | null): string {
  if (!value) return 'No expiration'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function fullName(member: Member): string {
  return `${member.firstName} ${member.lastName}`
}

function StatusBadge({ member }: { member: Member }) {
  if (member.status === 'active') {
    return <Badge variant="primary">Active</Badge>
  }
  if (member.status === 'paused') {
    return <Badge variant="outline">Paused</Badge>
  }
  return <Badge variant="accent">Pending</Badge>
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-sm text-secondary">{children}</p>
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof HeartPulse
}) {
  return (
    <Card className="min-h-[96px]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
          {label}
        </span>
        <Icon size={17} className="text-secondary" />
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-heading">
        {value}
      </p>
    </Card>
  )
}

function MemberRow({ member }: { member: Member }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/member/${member.id}`}
            className="font-medium text-heading hover:text-primary"
          >
            {fullName(member)}
          </Link>
          <StatusBadge member={member} />
        </div>
        <p className="mt-1 text-sm text-secondary">
          {member.neighborhood} - joined {formatDate(member.joinedAt)}
        </p>
        <p className="text-xs text-muted">{member.email}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {member.status !== 'active' && (
          <form action={setMemberStatusAction}>
            <input type="hidden" name="memberId" value={member.id} />
            <input type="hidden" name="status" value="active" />
            <Button type="submit" size="sm">
              <UserCheck size={14} />
              Approve
            </Button>
          </form>
        )}
        {member.status !== 'paused' && (
          <form action={setMemberStatusAction}>
            <input type="hidden" name="memberId" value={member.id} />
            <input type="hidden" name="status" value="paused" />
            <Button type="submit" variant="secondary" size="sm">
              Pause
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

function MemberReviewSection({
  pendingMembers,
  pausedMembers,
}: {
  pendingMembers: Member[]
  pausedMembers: Member[]
}) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-heading">Member Review</h2>
          <p className="text-sm text-secondary">
            Approve new members and restore paused accounts.
          </p>
        </div>
        <ShieldCheck size={20} className="text-primary" />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-heading">Pending</h3>
        {pendingMembers.length === 0 ? (
          <EmptyState>No pending members.</EmptyState>
        ) : (
          pendingMembers.map((member) => <MemberRow key={member.id} member={member} />)
        )}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-heading">Paused</h3>
        {pausedMembers.length === 0 ? (
          <EmptyState>No paused members.</EmptyState>
        ) : (
          pausedMembers.map((member) => <MemberRow key={member.id} member={member} />)
        )}
      </div>
    </Card>
  )
}

function InviteSection({ invites }: { invites: CommunityInvite[] }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-heading">Invite Tracking</h2>
          <p className="text-sm text-secondary">
            Watch code usage and expiration before launch cohorts fill up.
          </p>
        </div>
        <Mail size={20} className="text-primary" />
      </div>
      {invites.length === 0 ? (
        <EmptyState>No invite codes are configured.</EmptyState>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => {
            const remaining =
              invite.maxUses === null
                ? 'Unlimited'
                : Math.max(invite.maxUses - invite.usageCount, 0)
            return (
              <div
                key={invite.id}
                className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-heading">{invite.code}</span>
                    <Badge variant={invite.isActive ? 'primary' : 'outline'}>
                      {invite.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-secondary">{invite.label}</p>
                </div>
                <div className="text-sm text-secondary sm:text-right">
                  <p>
                    <span className="font-medium text-heading tabular-nums">
                      {invite.usageCount}
                    </span>{' '}
                    used
                  </p>
                  <p>{remaining} remaining</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function DisputeSection({ disputes }: { disputes: Exchange[] }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-heading">Disputes</h2>
          <p className="text-sm text-secondary">
            Decide whether held credits return to the requester or release to the provider.
          </p>
        </div>
        <AlertTriangle size={20} className="text-accent" />
      </div>
      {disputes.length === 0 ? (
        <EmptyState>No disputed exchanges.</EmptyState>
      ) : (
        disputes.map((exchange) => (
          <div
            key={exchange.id}
            className="border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link
                  href={`/exchange/${exchange.id}`}
                  className="font-medium text-heading hover:text-primary"
                >
                  {exchange.listing?.title ?? 'Exchange'}
                </Link>
                <p className="mt-1 text-sm text-secondary">
                  {exchange.provider?.firstName ?? 'Provider'} and{' '}
                  {exchange.requester?.firstName ?? 'requester'} -{' '}
                  <span className="tabular-nums">{exchange.tuAmount}</span> credits
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={resolveDisputeAction}>
                  <input type="hidden" name="exchangeId" value={exchange.id} />
                  <input type="hidden" name="outcome" value="refund" />
                  <Button type="submit" variant="secondary" size="sm">
                    Refund
                  </Button>
                </form>
                <form action={resolveDisputeAction}>
                  <input type="hidden" name="exchangeId" value={exchange.id} />
                  <input type="hidden" name="outcome" value="release" />
                  <Button type="submit" size="sm">
                    Release
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ))
      )}
    </Card>
  )
}

function MatchAssistSection({ assists }: { assists: StewardMatchAssist[] }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-heading">Match Assist</h2>
          <p className="text-sm text-secondary">
            Open needs with strong offer candidates for a steward introduction.
          </p>
        </div>
        <Handshake size={20} className="text-primary" />
      </div>
      {assists.length === 0 ? (
        <EmptyState>No assisted matches need attention.</EmptyState>
      ) : (
        assists.map((assist) => (
          <div
            key={assist.need.id}
            className="border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0"
          >
            <Link
              href={`/listing/${assist.need.id}`}
              className="font-medium text-heading hover:text-primary"
            >
              {assist.need.title}
            </Link>
            <p className="mt-1 text-sm text-secondary">
              {assist.need.member?.firstName ?? 'A member'} needs help in{' '}
              {assist.need.category}.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {assist.matches.map((match) => (
                <Link
                  key={match.listing.id}
                  href={`/listing/${match.listing.id}`}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border px-3 text-sm font-medium text-heading hover:border-primary hover:text-primary"
                >
                  <Sparkles size={13} />
                  {match.listing.member?.firstName ?? 'Offer'}: {match.listing.title}
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </Card>
  )
}

function ListingCleanupRow({ listing }: { listing: Listing }) {
  return (
    <div className="border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/listing/${listing.id}`}
            className="font-medium text-heading hover:text-primary"
          >
            {listing.title}
          </Link>
          <p className="mt-1 text-sm text-secondary">
            {listing.member?.firstName ?? 'Member'} - expires{' '}
            {formatDate(listing.expiresAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={refreshListingAction}>
            <input type="hidden" name="listingId" value={listing.id} />
            <Button type="submit" variant="secondary" size="sm">
              Refresh
            </Button>
          </form>
          <form action={archiveListingAction}>
            <input type="hidden" name="listingId" value={listing.id} />
            <Button type="submit" variant="ghost" size="sm">
              Archive
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function HappeningCleanupRow({ happening }: { happening: Happening }) {
  return (
    <div className="border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/happenings/${happening.id}`}
            className="font-medium text-heading hover:text-primary"
          >
            {happening.title}
          </Link>
          <p className="mt-1 text-sm text-secondary">
            Ended {formatDate(happening.endAt)} at {happening.location}
          </p>
        </div>
        <form action={deletePastHappeningAction}>
          <input type="hidden" name="happeningId" value={happening.id} />
          <Button type="submit" variant="ghost" size="sm">
            Remove
          </Button>
        </form>
      </div>
    </div>
  )
}

function CleanupSection({
  staleListings,
  staleHappenings,
}: {
  staleListings: Listing[]
  staleHappenings: Happening[]
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-heading">Content Cleanup</h2>
          <p className="text-sm text-secondary">
            Keep the boards current by refreshing good listings and clearing old events.
          </p>
        </div>
        <CalendarX size={20} className="text-primary" />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-heading">Stale Listings</h3>
        {staleListings.length === 0 ? (
          <EmptyState>No stale listings.</EmptyState>
        ) : (
          staleListings.map((listing) => (
            <ListingCleanupRow key={listing.id} listing={listing} />
          ))
        )}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-heading">Past Events</h3>
        {staleHappenings.length === 0 ? (
          <EmptyState>No past events to clean up.</EmptyState>
        ) : (
          staleHappenings.map((happening) => (
            <HappeningCleanupRow key={happening.id} happening={happening} />
          ))
        )}
      </div>
    </Card>
  )
}

function FlagSection({ flags }: { flags: StewardFlag[] }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-heading">Flagged Content</h2>
          <p className="text-sm text-secondary">
            Resolve reported members, listings, exchanges, and events.
          </p>
        </div>
        <Flag size={20} className="text-accent" />
      </div>
      {flags.length === 0 ? (
        <EmptyState>No open flags.</EmptyState>
      ) : (
        flags.map((flag) => (
          <div
            key={flag.id}
            className="flex flex-col gap-3 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              {flag.targetHref ? (
                <Link
                  href={flag.targetHref}
                  className="font-medium text-heading hover:text-primary"
                >
                  {flag.targetLabel}
                </Link>
              ) : (
                <p className="font-medium text-heading">{flag.targetLabel}</p>
              )}
              <p className="mt-1 text-sm text-secondary">{flag.reason}</p>
              <p className="text-xs text-muted">
                {flag.targetType} - opened {formatDate(flag.createdAt)}
              </p>
            </div>
            <form action={resolveFlagAction}>
              <input type="hidden" name="flagId" value={flag.id} />
              <Button type="submit" variant="secondary" size="sm">
                <CheckCircle2 size={14} />
                Resolve
              </Button>
            </form>
          </div>
        ))
      )}
    </Card>
  )
}

export function StewardConsole({ dashboard }: { dashboard: StewardDashboard }) {
  const { metrics } = dashboard

  return (
    <div className="px-4 pt-12 pb-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck size={14} />
            {dashboard.community?.name ?? 'Network'} operator
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            Steward Console
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Signed in as {fullName(dashboard.currentSteward)}
          </p>
        </div>
        <Link href="/profile">
          <Button variant="secondary" size="sm">
            My profile
          </Button>
        </Link>
      </div>

      <section aria-labelledby="community-health-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <HeartPulse size={18} className="text-primary" />
          <h2 id="community-health-heading" className="text-lg font-semibold text-heading">
            Community Health
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Active members" value={metrics.activeMembers} icon={UserCheck} />
          <MetricCard label="Open needs" value={metrics.activeNeeds} icon={Handshake} />
          <MetricCard label="Open offers" value={metrics.activeOffers} icon={Sparkles} />
          <MetricCard label="Active exchanges" value={metrics.activeExchanges} icon={CircleDollarSign} />
          <MetricCard label="Pending members" value={metrics.pendingMembers} icon={ShieldCheck} />
          <MetricCard label="Disputes" value={metrics.disputedExchanges} icon={AlertTriangle} />
          <MetricCard label="Stale listings" value={metrics.staleListings} icon={CalendarX} />
          <MetricCard label="Open flags" value={metrics.openFlags} icon={Flag} />
        </div>
      </section>

      <MemberReviewSection
        pendingMembers={dashboard.pendingMembers}
        pausedMembers={dashboard.pausedMembers}
      />
      <InviteSection invites={dashboard.invites} />
      <DisputeSection disputes={dashboard.disputes} />
      <MatchAssistSection assists={dashboard.matchAssists} />
      <CleanupSection
        staleListings={dashboard.staleListings}
        staleHappenings={dashboard.staleHappenings}
      />
      <FlagSection flags={dashboard.openFlags} />
    </div>
  )
}
