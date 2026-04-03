'use client'

import { cn } from '@/lib/utils'

export type StepStatus = 'completed' | 'active' | 'pending'

export interface Step {
  label: string
  status: StepStatus
}

export interface StatusStepperProps {
  steps: Step[]
  className?: string
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.5 6.5L4.5 8.5L9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StepCircle({ status }: { status: StepStatus }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full shrink-0',
        'h-7 w-7 transition-all duration-300 ease-out',
        status === 'completed' && 'bg-primary text-primary-foreground',
        status === 'active' &&
          'bg-primary text-primary-foreground ring-4 ring-primary/15',
        status === 'pending' && 'bg-border-light text-muted border-2 border-border',
      )}
    >
      {status === 'completed' && <CheckIcon />}
      {status === 'active' && (
        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
      )}
    </div>
  )
}

function Connector({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-border-light">
      <div
        className={cn(
          'h-full rounded-full bg-primary transition-all duration-500 ease-out',
          isCompleted ? 'w-full' : 'w-0',
        )}
      />
    </div>
  )
}

export function StatusStepper({ steps, className }: StatusStepperProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Circles + connectors */}
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step.label} className="contents">
            <StepCircle status={step.status} />
            {i < steps.length - 1 && (
              <Connector isCompleted={step.status === 'completed'} />
            )}
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="flex mt-2">
        {steps.map((step, i) => (
          <div
            key={step.label}
            className={cn(
              'text-[11px] leading-tight font-medium text-center',
              // First label aligns left, last aligns right, middle centers
              i === 0 && 'text-left',
              i === steps.length - 1 && 'text-right ml-auto',
              i > 0 && i < steps.length - 1 && 'flex-1',
              step.status === 'pending' ? 'text-muted' : 'text-secondary',
            )}
            style={
              // Equal distribution for middle labels
              i === 0 || i === steps.length - 1
                ? { width: '3.5rem' }
                : undefined
            }
          >
            {step.label}
          </div>
        ))}
      </div>
    </div>
  )
}
