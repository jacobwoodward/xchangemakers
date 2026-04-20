'use client'

import Link from 'next/link'
import {
  UtensilsCrossed,
  Wrench,
  Lightbulb,
  GraduationCap,
  Palette,
  Heart,
  Cpu,
  Home,
  Baby,
  MoreHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ListingCategory } from '@/lib/exchange-engine'
import { PressableCard } from '@/components/ui'

interface ShopLocalCategory {
  label: string
  value: ListingCategory
  icon: LucideIcon
  color: string
}

// Curated set — the categories that make sense for "Shop Local" discovery,
// ordered by how commonly people browse them in a neighborhood context.
const CATEGORIES: ShopLocalCategory[] = [
  { label: 'Home & Repair', value: 'home', icon: Home, color: 'bg-primary/10 text-primary' },
  { label: 'Services', value: 'services', icon: Wrench, color: 'bg-info/10 text-info' },
  { label: 'Food', value: 'food', icon: UtensilsCrossed, color: 'bg-accent/10 text-accent-dark' },
  { label: 'Wellness', value: 'wellness', icon: Heart, color: 'bg-primary/10 text-primary' },
  { label: 'Classes', value: 'classes', icon: GraduationCap, color: 'bg-info/10 text-info' },
  { label: 'Handmade', value: 'handmade', icon: Palette, color: 'bg-accent/10 text-accent-dark' },
  { label: 'Skills', value: 'skills', icon: Lightbulb, color: 'bg-primary/10 text-primary' },
  { label: 'Kids', value: 'kids', icon: Baby, color: 'bg-info/10 text-info' },
  { label: 'Tech', value: 'tech', icon: Cpu, color: 'bg-accent/10 text-accent-dark' },
]

export function ShopLocalCategories() {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2.5">
      {CATEGORIES.slice(0, 8).map(({ label, value, icon: Icon, color }) => (
        <Link key={value} href={`/search?category=${value}&type=businesses`}>
          <PressableCard className="flex flex-col items-center text-center py-4 px-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}
            >
              <Icon size={18} />
            </div>
            <p className="mt-2 text-xs font-semibold text-heading leading-tight">
              {label}
            </p>
          </PressableCard>
        </Link>
      ))}

      {/* See all tile — takes the 9th slot */}
      <Link href="/search?type=businesses">
        <PressableCard className="flex flex-col items-center text-center py-4 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hover text-secondary">
            <MoreHorizontal size={18} />
          </div>
          <p className="mt-2 text-xs font-semibold text-heading leading-tight">
            See all
          </p>
        </PressableCard>
      </Link>
    </div>
  )
}
