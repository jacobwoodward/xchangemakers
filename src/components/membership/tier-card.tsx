'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Badge, Button } from '@/components/ui'
import type { MembershipTierInfo } from '@/lib/exchange-engine'

interface TierCardProps {
  tier: MembershipTierInfo
  isSelected: boolean
  isRecommended: boolean
  onSelect: () => void
}

function formatPrice(tier: MembershipTierInfo): string {
  if (tier.hoursRequired) {
    return `$0 + ${tier.hoursRequired} hrs/mo`
  }
  if (tier.annualCost === 0) {
    return 'Free'
  }
  return `$${tier.annualCost}/year`
}

function formatTreasuryContribution(tier: MembershipTierInfo): string | null {
  if (tier.treasuryContribution <= 0) return null
  return `$${tier.treasuryContribution} to treasury`
}

export function TierCard({
  tier,
  isSelected,
  isRecommended,
  onSelect,
}: TierCardProps) {
  const contribution = formatTreasuryContribution(tier)

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <Card
        className={cn(
          'relative border-2 transition-colors duration-200',
          isRecommended
            ? 'border-primary shadow-md'
            : isSelected
              ? 'border-primary/50'
              : 'border-transparent',
        )}
      >
        {/* Recommended label */}
        {isRecommended && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant="primary" className="text-[10px] px-3 py-1 shadow-sm">
              Recommended
            </Badge>
          </div>
        )}

        <div className="space-y-3">
          {/* Header: name + price */}
          <div className="flex items-start justify-between pt-1">
            <div>
              <h3 className="text-lg font-bold text-heading leading-tight">
                {tier.name}
              </h3>
              <p className="text-base font-semibold text-primary mt-0.5">
                {formatPrice(tier)}
              </p>
            </div>

            {/* Selection indicator */}
            <div
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1',
                'transition-colors duration-200',
                isSelected
                  ? 'bg-primary border-primary'
                  : 'border-border bg-transparent',
              )}
            >
              {isSelected && <Check size={14} className="text-primary-foreground" />}
            </div>
          </div>

          {/* Treasury contribution badge */}
          {contribution && (
            <Badge variant="accent" className="text-[11px]">
              {contribution}
            </Badge>
          )}

          {/* Feature list */}
          <ul className="space-y-1.5">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check
                  size={14}
                  className="text-primary shrink-0 mt-0.5"
                />
                <span className="text-sm text-body leading-snug">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* Select button */}
          <Button
            variant={isSelected ? 'primary' : isRecommended ? 'primary' : 'secondary'}
            size="md"
            className="w-full"
            onClick={onSelect}
          >
            {isSelected ? 'Selected' : 'Select'}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
