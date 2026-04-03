'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
} as const

const dotSizeMap = {
  xs: 'h-2 w-2 border',
  sm: 'h-2.5 w-2.5 border-[1.5px]',
  md: 'h-3 w-3 border-2',
  lg: 'h-3.5 w-3.5 border-2',
  xl: 'h-4 w-4 border-2',
} as const

export type AvatarSize = keyof typeof sizeMap

export interface AvatarProps {
  src?: string | null
  alt?: string
  firstName?: string
  lastName?: string
  size?: AvatarSize
  isAvailable?: boolean
  className?: string
}

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.trim().charAt(0).toUpperCase() ?? ''
  const last = lastName?.trim().charAt(0).toUpperCase() ?? ''
  return first + last || '?'
}

/** Deterministic warm color from name string */
function getAvatarColor(name: string): string {
  const colors = [
    'bg-primary/15 text-primary-dark',
    'bg-accent/15 text-accent-dark',
    'bg-info/15 text-info',
    'bg-error/15 text-error',
    'bg-primary-light/20 text-primary-dark',
    'bg-accent-light/20 text-accent-dark',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({
  src,
  alt,
  firstName,
  lastName,
  size = 'md',
  isAvailable,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(firstName, lastName)
  const showImage = src && !imgError
  const colorClass = getAvatarColor(`${firstName ?? ''}${lastName ?? ''}`)

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-semibold select-none',
          sizeMap[size],
          !showImage && colorClass,
        )}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt ?? `${firstName ?? ''} ${lastName ?? ''}`.trim()}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
            draggable={false}
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </div>

      {isAvailable && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full bg-success border-surface',
            dotSizeMap[size],
          )}
          aria-label="Available"
        />
      )}
    </div>
  )
}
