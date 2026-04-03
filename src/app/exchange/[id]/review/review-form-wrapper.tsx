'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ReviewForm } from '@/components/exchange/review-form'
import { createReviewAction } from '../actions'
import type { Exchange, Member, ReputationTagType } from '@/lib/exchange-engine'

interface ReviewFormWrapperProps {
  exchange: Exchange
  reviewee: Member
}

export function ReviewFormWrapper({ exchange, reviewee }: ReviewFormWrapperProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(tags: ReputationTagType[], note: string) {
    setError(null)

    startTransition(async () => {
      try {
        const result = await createReviewAction(
          exchange.id,
          reviewee.id,
          tags,
          note,
        )

        if (result.error) {
          setError(result.error)
          return
        }

        router.push(`/exchange/${exchange.id}`)
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <>
      <ReviewForm
        exchange={exchange}
        reviewee={reviewee}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
      />
      {error && (
        <div className="mt-4 px-3 py-2.5 rounded-lg bg-error/8 border border-error/15">
          <p className="text-xs text-error font-medium">{error}</p>
        </div>
      )}
    </>
  )
}
