export const dynamic = 'force-dynamic'

import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { BalanceHero } from '@/components/treasury/balance-hero'
import { TierDisplay } from '@/components/treasury/tier-display'
import { CommunityStats } from '@/components/treasury/community-stats'
import { ProgressBar, Card } from '@/components/ui'
import { Vote, PiggyBank, Users } from 'lucide-react'

/** Compute progress % toward the next community tier. */
function tierProgress(balance: number): { percent: number; label: string } {
  if (balance < 1000) {
    return {
      percent: (balance / 1000) * 100,
      label: `$${balance.toLocaleString()} / $1,000 to Active`,
    }
  }
  if (balance < 5000) {
    return {
      percent: ((balance - 1000) / 4000) * 100,
      label: `$${balance.toLocaleString()} / $5,000 to Established`,
    }
  }
  if (balance < 10000) {
    return {
      percent: ((balance - 5000) / 5000) * 100,
      label: `$${balance.toLocaleString()} / $10,000 to Strong`,
    }
  }
  return { percent: 100, label: 'Strong tier reached!' }
}

const HOW_IT_WORKS = [
  {
    Icon: PiggyBank,
    title: '50% of every membership goes to this treasury',
    description:
      'When a business pays their annual membership, half goes directly into the community fund.',
  },
  {
    Icon: Vote,
    title: 'When we reach $10,000, a community vote unlocks',
    description:
      'The treasury stays locked until the community collectively grows it to the Strong tier.',
  },
  {
    Icon: Users,
    title: 'One member, one vote \u2014 you decide how to use it',
    description:
      'Every member gets equal say. No weighted votes. No backroom deals. Pure community democracy.',
  },
]

export default async function TreasuryPage() {
  await exchangeEngine.initialize()
  const treasury = await exchangeEngine.getTreasury()

  const progress = tierProgress(treasury.balance)

  return (
    <>
      <PageHeader title="Community Treasury" />
      <PageTransition>
        <div className="pt-16 pb-28 px-4 space-y-6">
          {/* ---- Balance hero ---- */}
          <BalanceHero
            communityName={treasury.communityName}
            balance={treasury.balance}
          />

          {/* ---- Tier display ---- */}
          <TierDisplay currentTier={treasury.tier} balance={treasury.balance} />

          {/* ---- Progress to next tier ---- */}
          <div className="px-1">
            <ProgressBar
              value={progress.percent}
              color="primary"
              label={progress.label}
            />
          </div>

          {/* ---- Community stats ---- */}
          <CommunityStats treasury={treasury} />

          {/* ---- How it works ---- */}
          <div className="pt-2">
            <h2 className="text-base font-semibold text-heading mb-3">
              How It Works
            </h2>
            <div className="space-y-3">
              {HOW_IT_WORKS.map((item, i) => (
                <Card key={i} className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <item.Icon size={17} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-heading leading-snug">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  )
}
