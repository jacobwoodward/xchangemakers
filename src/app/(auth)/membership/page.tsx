'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { PageTransition } from '@/components/shared/page-transition'
import { TierCard } from '@/components/membership/tier-card'
import type { MembershipTierInfo, MembershipType } from '@/lib/exchange-engine'

/**
 * Static tier data — mirrors ExchangeEngineClient.getMembershipTiers() but
 * inlined here so this page stays a client component without a server call.
 * The membership page lives in the (auth) flow before a DB session exists.
 */
const TIERS: MembershipTierInfo[] = [
  {
    type: 'standard',
    name: 'Standard',
    annualCost: 120,
    treasuryContribution: 60,
    hoursRequired: null,
    features: [
      'Create listings (offerings & needs)',
      'Exchange with neighbors',
      'RSVP to happenings',
      'Direct messaging',
      'Reputation tags',
      '$60/year funds the community treasury',
    ],
  },
  {
    type: 'business',
    name: 'Shop Local Business',
    annualCost: 240,
    treasuryContribution: 120,
    hoursRequired: null,
    features: [
      'Everything in Standard',
      'Featured in Shop Local search',
      'Business badge on profile',
      'Priority listing placement',
      'Monthly analytics dashboard',
      '$120/year funds the community treasury',
    ],
  },
  {
    type: 'community_contribution',
    name: 'Community Contribution',
    annualCost: 0,
    treasuryContribution: 20,
    hoursRequired: 10,
    features: [
      'Everything in Standard',
      'Community contributor badge',
      'Free membership via 10 verified hours/year',
      'Platform funds $20 treasury deposit',
      'Treasury voting rights',
    ],
  },
]

/** Display order: Standard first (recommended), then Business, then Community */
const DISPLAY_ORDER: MembershipType[] = ['standard', 'business', 'community_contribution']

export default function MembershipPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<MembershipType>('standard')
  const [confirming, setConfirming] = useState(false)

  const handleSelect = (type: MembershipType) => {
    if (confirming) return

    if (selected === type) {
      // Already selected — confirm and navigate
      setConfirming(true)
      setTimeout(() => {
        router.push('/')
      }, 1200)
    } else {
      setSelected(type)
    }
  }

  const ordered = DISPLAY_ORDER.map(
    (type) => TIERS.find((t) => t.type === type)!,
  )

  return (
    <PageTransition>
      <div
        className="min-h-dvh px-4 py-8"
        style={{ backgroundColor: 'var(--xm-bg-page)' }}
      >
        <div
          className="mx-auto space-y-6"
          style={{ maxWidth: 'var(--xm-content-max-width)' }}
        >
          {/* ---- Heading ---- */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold text-heading tracking-tight">
              Choose Your Membership
            </h1>
            <p className="text-sm text-secondary leading-relaxed">
              Every membership strengthens your community treasury
            </p>
          </div>

          {/* ---- Confirmation toast ---- */}
          {confirming && (
            <motion.div
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/10 text-primary text-sm font-medium"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ShieldCheck size={18} />
              Welcome to the community!
            </motion.div>
          )}

          {/* ---- Tier cards ---- */}
          <div className="space-y-4">
            {ordered.map((tier) => (
              <TierCard
                key={tier.type}
                tier={tier}
                isSelected={selected === tier.type}
                isRecommended={tier.type === 'standard'}
                onSelect={() => handleSelect(tier.type)}
              />
            ))}
          </div>

          {/* ---- Trust footer ---- */}
          <p className="text-center text-xs text-muted pt-2 pb-4 leading-relaxed">
            No ads. No data selling. No pay-to-rank. Ever.
            <br />
            <span className="text-muted/70">
              No one should be locked out by money.
            </span>
          </p>
        </div>
      </div>
    </PageTransition>
  )
}
