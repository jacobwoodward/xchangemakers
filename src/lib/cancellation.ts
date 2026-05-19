import type { CancellationReason } from '@/lib/exchange-engine'

export const CANCELLATION_REASON_OPTIONS: Array<{
  value: CancellationReason
  label: string
}> = [
  { value: 'schedule_conflict', label: 'Schedule conflict' },
  { value: 'no_longer_needed', label: 'No longer needed' },
  { value: 'helper_drop', label: 'Helper had to drop' },
  { value: 'requester_cancel', label: 'Requester cancelled' },
  { value: 'safety_concern', label: 'Safety concern' },
  { value: 'other', label: 'Other' },
]

export function formatCancellationReason(
  reason: CancellationReason | string | null | undefined,
): string {
  const option = CANCELLATION_REASON_OPTIONS.find((item) => item.value === reason)
  if (option) return option.label
  if (!reason) return 'No reason captured'

  return reason
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
