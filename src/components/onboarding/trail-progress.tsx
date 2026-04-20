import { ProgressBar } from '@/components/ui/progress-bar'
import type { OnboardingProgress } from '@/lib/exchange-engine/types'
import { TOTAL_ONBOARDING_TU } from '@/lib/exchange-engine/constants'

interface TrailProgressProps {
  steps: OnboardingProgress[]
}

export function TrailProgress({ steps }: TrailProgressProps) {
  const completedSteps = steps.filter((s) => s.completed)
  const tuEarned = completedSteps.reduce((sum, s) => sum + s.tuEarned, 0)
  const percentage = Math.round((tuEarned / TOTAL_ONBOARDING_TU) * 100)
  const remaining = TOTAL_ONBOARDING_TU - tuEarned

  return (
    <div className="bg-surface rounded-xl p-5 shadow-card">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-semibold text-heading">Your Trail</h2>
        <span className="text-sm font-semibold tabular-nums text-primary">
          {tuEarned} / {TOTAL_ONBOARDING_TU} TU
        </span>
      </div>

      <p className="text-xs text-muted mb-3">
        {completedSteps.length} of {steps.length} steps complete
        {remaining > 0 && (
          <>
            {' '}·{' '}
            <span className="font-medium text-secondary">
              {remaining} TU to go
            </span>
          </>
        )}
      </p>

      <ProgressBar
        value={percentage}
        color="primary"
      />
    </div>
  )
}
