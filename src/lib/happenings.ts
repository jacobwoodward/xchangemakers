import type { HappeningCategory } from '@/lib/exchange-engine/types'

export const HAPPENING_CATEGORY_LABELS: Record<HappeningCategory, string> = {
  kids: 'Kids & Family',
  food: 'Cooking / Food',
  markets: 'Garden / Outdoors',
  fitness: 'Wellness / Yoga',
  classes: 'Arts & Crafts',
  social: 'Social Mixers',
  community: 'Volunteering',
  exchange_event: 'Community Exchange',
}

export function formatHappeningCategory(category: HappeningCategory): string {
  return HAPPENING_CATEGORY_LABELS[category] ?? 'Happening'
}
