export const dynamic = 'force-dynamic'

import { exchangeEngine } from '@/lib/exchange-engine/client'
import { TrailProgress } from '@/components/onboarding/trail-progress'
import { OnboardingTrailClient } from './trail-client'

export default async function OnboardingPage() {
  await exchangeEngine.initialize()
  const member = await exchangeEngine.getCurrentMember()
  const steps = await exchangeEngine.getOnboardingTrail(member.id)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pt-2 pb-1">
        <h1 className="text-xl font-bold text-heading">Your Trail</h1>
        <p className="text-sm text-secondary mt-0.5">
          Complete each step to earn Time Units — 1 TU ≈ 1 hour of community time
        </p>
      </div>

      {/* Progress overview */}
      <TrailProgress steps={steps} />

      {/* Step cards (client component for interactivity) */}
      <OnboardingTrailClient initialSteps={steps} />
    </div>
  )
}
