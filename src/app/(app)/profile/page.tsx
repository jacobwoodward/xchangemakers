import Link from 'next/link'
import { exchangeEngine } from '@/lib/exchange-engine'
import { PageTransition } from '@/components/shared/page-transition'
import { Card, Avatar, Badge, Button } from '@/components/ui'
import { MemberHeader } from '@/components/profile/member-header'
import { ReputationTags } from '@/components/profile/reputation-tags'
import { OfferingsList } from '@/components/profile/offerings-list'
import { AvailabilityDisplay } from '@/components/profile/availability-display'
import {
  Zap,
  Pencil,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import type { OnboardingProgress } from '@/lib/exchange-engine'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EuBalanceMini({
  balance,
  monthlyEarned,
}: {
  balance: number
  monthlyEarned: number
}) {
  return (
    <Card
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #4A7249 0%, #7BAF7A 100%)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-white/70" />
          <span className="text-sm font-medium text-white/70">My Balance</span>
        </div>
        <span className="text-xs font-medium text-white/50 tabular-nums">
          {monthlyEarned} EU this month
        </span>
      </div>
      <p className="mt-1.5 text-3xl font-bold tracking-tight text-white tabular-nums">
        {balance}{' '}
        <span className="text-base font-semibold text-white/60">EU</span>
      </p>
    </Card>
  )
}

const STEP_LABELS: Record<string, string> = {
  profile_photo: 'Add a profile photo',
  intro_vibe: 'Write your vibe',
  add_offerings: 'Post an offering',
  post_need: 'Post a need',
  rsvp_happening: 'RSVP to a happening',
  first_exchange: 'Complete your first exchange',
  first_review: 'Leave a review',
  invite_neighbor: 'Invite a neighbor',
}

function OnboardingTrail({ steps }: { steps: OnboardingProgress[] }) {
  const total = steps.length
  const completed = steps.filter((s) => s.completed).length

  if (total === 0 || completed === total) return null

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          EU Trail
        </h3>
        <span className="text-xs font-medium text-primary tabular-nums">
          {completed}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-hover overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const label = STEP_LABELS[step.step] ?? step.step
          return (
            <div key={step.id} className="flex items-center gap-2.5">
              {step.completed ? (
                <CheckCircle2 size={16} className="text-primary shrink-0" />
              ) : (
                <Circle size={16} className="text-border shrink-0" />
              )}
              <span
                className={
                  step.completed
                    ? 'text-sm text-muted line-through'
                    : 'text-sm text-body'
                }
              >
                {label}
              </span>
              {!step.completed && step.euEarned > 0 && (
                <Badge variant="primary" className="ml-auto text-[10px]">
                  +{step.euEarned} EU
                </Badge>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function MyProfilePage() {
  await exchangeEngine.initialize()
  const member = await exchangeEngine.getCurrentMember()
  const wallet = await exchangeEngine.getWallet(member.id)
  const availability = await exchangeEngine.getAvailability(member.id)
  const onboarding = await exchangeEngine.getOnboardingTrail(member.id)

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-6">
        {/* ─── Page title ─── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            My Profile
          </h1>
          <Link href="/profile/edit">
            <Button variant="ghost" size="sm">
              <Pencil size={15} />
              Edit
            </Button>
          </Link>
        </div>

        {/* ─── EU Balance ─── */}
        <EuBalanceMini
          balance={wallet.balance}
          monthlyEarned={wallet.monthlyEarned}
        />

        {/* ─── Onboarding Trail (if incomplete) ─── */}
        {onboarding.length > 0 && <OnboardingTrail steps={onboarding} />}

        {/* ─── Profile header ─── */}
        <MemberHeader member={member} />

        {/* ─── Reputation tags ─── */}
        {member.reputationTags.length > 0 && (
          <ReputationTags tags={member.reputationTags} />
        )}

        {/* ─── Offerings & Needs ─── */}
        <OfferingsList offerings={member.offerings} needs={member.needs} />

        {/* ─── Availability ─── */}
        {availability.length > 0 && (
          <AvailabilityDisplay slots={availability} />
        )}
      </div>
    </PageTransition>
  )
}
