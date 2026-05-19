export const dynamic = 'force-dynamic'

import { exchangeEngine } from '@/lib/exchange-engine/client'
import { TrailProgress } from '@/components/onboarding/trail-progress'
import { PreferenceCapture } from '@/components/onboarding/preference-capture'
import { OnboardingTrailClient } from './trail-client'

export default async function OnboardingPage() {
  await exchangeEngine.initialize()
  const member = await exchangeEngine.getCurrentMember()
  const [steps, intentProfile] = await Promise.all([
    exchangeEngine.getOnboardingTrail(member.id),
    exchangeEngine.getMemberIntentProfile(member.id),
  ])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pt-2 pb-1">
        <h1 className="text-xl font-bold text-heading">Your Trail</h1>
        <p className="text-sm text-secondary mt-0.5">
          Complete real setup steps to earn starter credits and create your
          first useful matches.
        </p>
      </div>

      {/* Progress overview */}
      <TrailProgress steps={steps} />

      <PreferenceCapture initialProfile={intentProfile} />

      {/* Step cards (client component for interactivity) */}
      <OnboardingTrailClient initialSteps={steps} />
    </div>
  )
}
