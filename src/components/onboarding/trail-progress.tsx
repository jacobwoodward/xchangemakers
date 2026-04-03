import { ProgressBar } from '@/components/ui/progress-bar'
import type { OnboardingProgress } from '@/lib/exchange-engine/types'

const TOTAL_EU = 55

interface TrailProgressProps {
  steps: OnboardingProgress[]
}

export function TrailProgress({ steps }: TrailProgressProps) {
  const completedSteps = steps.filter((s) => s.completed)
  const euEarned = completedSteps.reduce((sum, s) => sum + s.euEarned, 0)
  const percentage = Math.round((euEarned / TOTAL_EU) * 100)

  return (
    <div className="bg-surface rounded-xl p-5 shadow-card">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-semibold text-heading">Your Journey</h2>
        <span className="text-sm font-semibold tabular-nums text-primary">
          {euEarned} / {TOTAL_EU} EU
        </span>
      </div>

      <p className="text-xs text-muted mb-3">
        {completedSteps.length} of {steps.length} steps complete
      </p>

      <ProgressBar
        value={percentage}
        color="primary"
      />
    </div>
  )
}
