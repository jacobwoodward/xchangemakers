'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Avatar, Button } from '@/components/ui'
import type { Exchange, Member, ReputationTagType } from '@/lib/exchange-engine'

export interface ReviewFormProps {
  exchange: Exchange
  reviewee: Member
  onSubmit: (tags: ReputationTagType[], note: string) => void
  isSubmitting?: boolean
}

const REPUTATION_TAGS: { value: ReputationTagType; label: string; emoji: string }[] = [
  { value: 'on_time', label: 'On Time', emoji: '\u23F0' },
  { value: 'quality', label: 'Quality', emoji: '\u2B50' },
  { value: 'friendly', label: 'Friendly', emoji: '\uD83D\uDE0A' },
  { value: 'generous', label: 'Generous', emoji: '\uD83D\uDC9B' },
  { value: 'reliable', label: 'Reliable', emoji: '\uD83E\uDDD1\u200D\uD83D\uDD27' },
  { value: 'great_communicator', label: 'Great Communicator', emoji: '\uD83D\uDCAC' },
]

export function ReviewForm({
  exchange,
  reviewee,
  onSubmit,
  isSubmitting = false,
}: ReviewFormProps) {
  const [selectedTags, setSelectedTags] = useState<ReputationTagType[]>([])
  const [note, setNote] = useState('')

  function toggleTag(tag: ReputationTagType) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  function handleSubmit() {
    if (selectedTags.length === 0) return
    onSubmit(selectedTags, note)
  }

  return (
    <div className="space-y-6">
      {/* ─── Heading + avatar ─── */}
      <div className="flex flex-col items-center text-center space-y-3">
        <Avatar
          src={reviewee.avatarUrl}
          firstName={reviewee.firstName}
          lastName={reviewee.lastName}
          size="xl"
          isAvailable={reviewee.isAvailable}
        />
        <div>
          <h2 className="text-xl font-bold text-heading">
            How was your exchange with {reviewee.firstName}?
          </h2>
          <p className="text-sm text-muted mt-1">
            Select tags that describe your experience
          </p>
        </div>
      </div>

      {/* ─── Tag selection ─── */}
      <Card>
        <div className="flex flex-wrap gap-2.5">
          {REPUTATION_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag.value)
            return (
              <motion.button
                key={tag.value}
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => toggleTag(tag.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full',
                  'text-sm font-medium transition-all duration-200 select-none',
                  'border',
                  isSelected
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-surface border-border text-body hover:border-primary/40 hover:bg-hover',
                )}
              >
                <span>{tag.emoji}</span>
                <span>{tag.label}</span>
              </motion.button>
            )
          })}
        </div>
      </Card>

      {/* ─── Private note ─── */}
      <Card>
        <label
          htmlFor="review-note"
          className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2"
        >
          Private note
        </label>
        <textarea
          id="review-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a private note (optional)"
          rows={3}
          className={cn(
            'w-full resize-none rounded-xl border border-border bg-page px-4 py-3',
            'text-sm text-body placeholder:text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40',
            'transition-all duration-200',
          )}
        />
      </Card>

      {/* ─── Trust notice ─── */}
      <div className="flex items-center justify-center gap-1.5 px-4">
        <Heart size={13} className="text-muted" />
        <p className="text-xs text-muted text-center">
          Reviews are private and help build community trust
        </p>
      </div>

      {/* ─── Submit ─── */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={selectedTags.length === 0}
        isLoading={isSubmitting}
        onClick={handleSubmit}
      >
        Submit Review
      </Button>
    </div>
  )
}
