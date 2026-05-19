import type { BusinessCategory } from '@/lib/exchange-engine'

export const BUSINESS_CATEGORIES: { value: BusinessCategory; label: string }[] = [
  { value: 'food_drink', label: 'Food & Drink' },
  { value: 'home_services', label: 'Home & Services' },
  { value: 'health_wellness', label: 'Health & Wellness' },
  { value: 'shopping_makers', label: 'Shopping & Makers' },
  { value: 'garden_outdoors', label: 'Garden & Outdoors' },
  { value: 'moving_help', label: 'Moving Help' },
  { value: 'professional', label: 'Professional' },
  { value: 'other', label: 'Other' },
]

const BUSINESS_CATEGORY_LABELS = new Map(
  BUSINESS_CATEGORIES.map((category) => [category.value, category.label]),
)

export function formatBusinessCategory(category: BusinessCategory): string {
  return BUSINESS_CATEGORY_LABELS.get(category) ?? 'Other'
}
