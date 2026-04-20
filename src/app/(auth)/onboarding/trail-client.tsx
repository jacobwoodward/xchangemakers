'use client'

import { useState, useCallback, useTransition } from 'react'
import { StepCard, STEP_INFO } from '@/components/onboarding/step-card'
import { RewardAnimation } from '@/components/onboarding/reward-animation'
import { completeStepAction } from './actions'
import type { OnboardingProgress, OnboardingStep } from '@/lib/exchange-engine/types'

// Canonical step order
const STEP_ORDER: OnboardingStep[] = [
  'profile_photo',
  'intro_vibe',
  'add_offerings',
  'post_need',
  'rsvp_happening',
  'first_exchange',
  'first_review',
  'invite_neighbor',
]

function getStatus(
  step: OnboardingProgress,
  activeStep: OnboardingStep | null,
): 'completed' | 'active' | 'locked' {
  if (step.completed) return 'completed'
  if (step.step === activeStep) return 'active'
  return 'locked'
}

interface OnboardingTrailClientProps {
  initialSteps: OnboardingProgress[]
}

export function OnboardingTrailClient({ initialSteps }: OnboardingTrailClientProps) {
  const [steps, setSteps] = useState(initialSteps)
  const [reward, setReward] = useState<{ amount: number } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sort steps into canonical order
  const sortedSteps = STEP_ORDER.map(
    (stepName) =>
      steps.find((s) => s.step === stepName) ?? {
        id: stepName,
        memberId: '',
        step: stepName,
        completed: false,
        tuEarned: STEP_INFO[stepName].tu,
        completedAt: null,
      },
  )

  // First incomplete step is the active one
  const activeStep = sortedSteps.find((s) => !s.completed)?.step ?? null

  const handleComplete = useCallback(
    (step: OnboardingStep) => {
      const info = STEP_INFO[step]

      // Optimistic update — mark step as completed immediately
      setSteps((prev) =>
        prev.map((s) =>
          s.step === step
            ? { ...s, completed: true, completedAt: new Date().toISOString() }
            : s,
        ),
      )

      // Show reward animation
      setReward({ amount: info.tu })

      // Persist to server
      startTransition(async () => {
        await completeStepAction(step)
      })
    },
    [],
  )

  const handleRewardComplete = useCallback(() => {
    setReward(null)
  }, [])

  return (
    <>
      <div className="space-y-3">
        {sortedSteps.map((step, i) => (
          <StepCard
            key={step.step}
            step={step}
            status={getStatus(step, activeStep)}
            index={i}
            onAction={
              step.step === activeStep
                ? () => handleComplete(step.step)
                : undefined
            }
          />
        ))}
      </div>

      {/* Celebration overlay */}
      {reward && (
        <RewardAnimation
          amount={reward.amount}
          onComplete={handleRewardComplete}
        />
      )}
    </>
  )
}
