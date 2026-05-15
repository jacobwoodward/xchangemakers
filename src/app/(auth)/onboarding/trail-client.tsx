'use client'

import { StepCard, STEP_INFO } from '@/components/onboarding/step-card'
import type { OnboardingProgress, OnboardingStep } from '@/lib/exchange-engine/types'

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

const STEP_ACTIONS: Partial<
  Record<OnboardingStep, { href: string; label: string }>
> = {
  profile_photo: { href: '/profile/edit', label: 'Edit profile' },
  intro_vibe: { href: '/profile/edit', label: 'Edit profile' },
  add_offerings: { href: '/profile/listing/new?type=offering', label: 'Add offer' },
  post_need: { href: '/profile/listing/new?type=need', label: 'Post need' },
  rsvp_happening: { href: '/happenings', label: 'Find event' },
  first_exchange: { href: '/offers', label: 'Find help' },
  first_review: { href: '/exchanges', label: 'Open exchanges' },
}

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
  const sortedSteps = STEP_ORDER.map(
    (stepName) =>
      initialSteps.find((s) => s.step === stepName) ?? {
        id: stepName,
        memberId: '',
        step: stepName,
        completed: false,
        tuEarned: STEP_INFO[stepName].tu,
        completedAt: null,
      },
  )

  const activeStep = sortedSteps.find((s) => !s.completed)?.step ?? null

  return (
    <div className="space-y-3">
      {sortedSteps.map((step, i) => {
        const action = STEP_ACTIONS[step.step]
        return (
          <StepCard
            key={step.step}
            step={step}
            status={getStatus(step, activeStep)}
            index={i}
            actionHref={step.step === activeStep ? action?.href : undefined}
            actionLabel={step.step === activeStep ? action?.label : undefined}
          />
        )
      })}
    </div>
  )
}
