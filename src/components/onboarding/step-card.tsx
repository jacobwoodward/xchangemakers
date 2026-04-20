'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  Sparkles,
  Package,
  CircleHelp,
  Calendar,
  Handshake,
  Star,
  UserPlus,
  Check,
  Lock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OnboardingProgress, OnboardingStep } from '@/lib/exchange-engine/types'
import { ONBOARDING_TU_REWARDS } from '@/lib/exchange-engine/constants'

// ---- Step metadata ----------------------------------------------------------

interface StepInfo {
  title: string
  description: string
  tu: number
  icon: LucideIcon
}

function makeInfo(
  title: string,
  description: string,
  step: OnboardingStep,
  icon: LucideIcon,
): StepInfo {
  return { title, description, tu: ONBOARDING_TU_REWARDS[step], icon }
}

export const STEP_INFO: Record<OnboardingStep, StepInfo> = {
  profile_photo: makeInfo(
    'Add a photo',
    'Let your neighbors see who you are',
    'profile_photo',
    Camera,
  ),
  intro_vibe: makeInfo(
    'Share your vibe',
    'Write a short intro and your vibe tagline',
    'intro_vibe',
    Sparkles,
  ),
  add_offerings: makeInfo(
    'List 3 offerings',
    'What can you offer your neighbors?',
    'add_offerings',
    Package,
  ),
  post_need: makeInfo(
    'Post a need',
    'What do you need from your community?',
    'post_need',
    CircleHelp,
  ),
  rsvp_happening: makeInfo(
    'RSVP to a happening',
    "Find an event and say you're going",
    'rsvp_happening',
    Calendar,
  ),
  first_exchange: makeInfo(
    'Complete your first exchange',
    'The real unlock — book and complete an exchange',
    'first_exchange',
    Handshake,
  ),
  first_review: makeInfo(
    'Leave a review',
    'Close the trust loop with your first review',
    'first_review',
    Star,
  ),
  invite_neighbor: makeInfo(
    'Invite a neighbor',
    'Bring someone you know into the community',
    'invite_neighbor',
    UserPlus,
  ),
}

// ---- Component --------------------------------------------------------------

type StepStatus = 'completed' | 'active' | 'locked'

interface StepCardProps {
  step: OnboardingProgress
  status: StepStatus
  index: number
  onAction?: () => void
}

export function StepCard({ step, status, index, onAction }: StepCardProps) {
  const info = STEP_INFO[step.step]
  const Icon = info.icon

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${step.step}-${status}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={cn(
          'relative rounded-xl border transition-all duration-300',
          status === 'completed' &&
            'bg-success/[0.06] border-success/20',
          status === 'active' &&
            'bg-surface border-primary/30 shadow-md',
          status === 'locked' &&
            'bg-hover/60 border-border-light opacity-50',
        )}
      >
        <div className="flex items-start gap-3.5 p-4">
          {/* Icon bubble */}
          <div
            className={cn(
              'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full',
              status === 'completed' && 'bg-success/15 text-success',
              status === 'active' && 'bg-primary/10 text-primary',
              status === 'locked' && 'bg-border-light text-muted',
            )}
          >
            {status === 'completed' ? (
              <Check className="w-5 h-5" strokeWidth={2.5} />
            ) : status === 'locked' ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3
                className={cn(
                  'text-[15px] font-semibold leading-snug',
                  status === 'completed' && 'text-success',
                  status === 'active' && 'text-heading',
                  status === 'locked' && 'text-muted',
                )}
              >
                {info.title}
              </h3>

              {/* TU badge */}
              {status === 'completed' && (
                <Badge variant="primary" className="bg-success/15 text-success">
                  +{info.tu} TU
                </Badge>
              )}
              {status === 'active' && (
                <Badge variant="accent">
                  Earn +{info.tu} TU
                </Badge>
              )}
              {status === 'locked' && (
                <Badge variant="outline" className="opacity-75">
                  +{info.tu} TU
                </Badge>
              )}
            </div>

            {/* Description — visible for active, hidden for others */}
            {status === 'active' && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
                className="text-sm text-secondary mt-1 mb-3"
              >
                {info.description}
              </motion.p>
            )}

            {status === 'completed' && (
              <p className="text-xs text-muted">Completed</p>
            )}

            {/* CTA for active step */}
            {status === 'active' && onAction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onAction}
                >
                  {info.title}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
