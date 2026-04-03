'use server'

import { exchangeEngine } from '@/lib/exchange-engine'
import type { SearchResult, ListingCategory } from '@/lib/exchange-engine'

export async function searchMembers(
  query: string,
  category?: ListingCategory,
): Promise<SearchResult> {
  await exchangeEngine.initialize()
  return exchangeEngine.search(query, { category })
}
