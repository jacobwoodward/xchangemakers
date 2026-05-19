'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowRightLeft,
  CalendarDays,
  CalendarPlus,
  CircleHelp,
  Plus,
  ShoppingBag,
  Sparkles,
  UsersRound,
  User,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

const tabs = [
  { label: 'Pulse', icon: Sparkles, path: '/', match: ['/'] },
  {
    label: 'Calendar',
    icon: CalendarDays,
    path: '/needs',
    match: ['/needs', '/happenings'],
  },
  {
    label: 'Exchange',
    icon: ArrowRightLeft,
    path: '/exchanges',
    match: ['/exchanges', '/exchange', '/messages'],
  },
  { label: 'Profile', icon: User, path: '/profile', match: ['/profile'] },
] as const

const createActions: {
  label: string
  description: string
  href: string
  icon: LucideIcon
  tone: 'primary' | 'accent' | 'surface'
}[] = [
  {
    label: 'Post a Need',
    description: 'Get help from your community',
    href: '/profile/listing/new?type=need',
    icon: CircleHelp,
    tone: 'primary',
  },
  {
    label: 'Create an Event',
    description: 'Host a community event',
    href: '/happenings/new',
    icon: CalendarPlus,
    tone: 'accent',
  },
  {
    label: 'Start a Group / Club',
    description: 'Bring people together',
    href: '/happenings/new?category=social',
    icon: UsersRound,
    tone: 'surface',
  },
  {
    label: 'List an Item or Service',
    description: 'Offer something to the community',
    href: '/profile/listing/new?type=offering',
    icon: ShoppingBag,
    tone: 'surface',
  },
]

function isTabActive(pathname: string, matchers: readonly string[]): boolean {
  if (matchers.includes('/')) return pathname === '/'
  return matchers.some((matcher) => pathname.startsWith(matcher))
}

export function BottomNav() {
  const pathname = usePathname()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      {isCreateOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/45"
            onClick={() => setIsCreateOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create"
            className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-[var(--xm-content-max-width)] rounded-t-[24px] bg-surface px-4 pb-6 pt-3 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1 w-11 rounded-full bg-border" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-heading">Create</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-hover text-heading transition-colors hover:bg-active"
                aria-label="Close create menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {createActions.map(
                ({ label, description, href, icon: Icon, tone }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setIsCreateOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors',
                      tone === 'primary' &&
                        'border-primary/20 bg-primary/8 text-heading hover:bg-primary/12',
                      tone === 'accent' &&
                        'border-accent/20 bg-accent/10 text-heading hover:bg-accent/15',
                      tone === 'surface' &&
                        'border-border-light bg-surface text-heading hover:bg-hover',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        tone === 'primary' && 'bg-primary/12 text-primary',
                        tone === 'accent' && 'bg-accent/15 text-accent-dark',
                        tone === 'surface' && 'bg-hover text-secondary',
                      )}
                    >
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {label}
                      </span>
                      <span className="block text-xs text-muted">
                        {description}
                      </span>
                    </span>
                  </Link>
                ),
              )}
            </div>
          </div>
        </>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-surface"
        style={{
          borderColor: 'var(--xm-border-light)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          className="mx-auto grid grid-cols-5"
          style={{
            maxWidth: 'var(--xm-content-max-width)',
            height: 'var(--xm-bottomnav-height)',
          }}
        >
          <NavLink
            label={tabs[0].label}
            icon={tabs[0].icon}
            path={tabs[0].path}
            isActive={isTabActive(pathname, tabs[0].match)}
          />
          <NavLink
            label={tabs[1].label}
            icon={tabs[1].icon}
            path={tabs[1].path}
            isActive={isTabActive(pathname, tabs[1].match)}
          />

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-primary"
            aria-label="Open create menu"
            aria-expanded={isCreateOpen}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Plus size={25} strokeWidth={2.3} />
            </span>
          </button>

          <NavLink
            label={tabs[2].label}
            icon={tabs[2].icon}
            path={tabs[2].path}
            isActive={isTabActive(pathname, tabs[2].match)}
          />
          <NavLink
            label={tabs[3].label}
            icon={tabs[3].icon}
            path={tabs[3].path}
            isActive={isTabActive(pathname, tabs[3].match)}
          />
        </div>
      </nav>
    </>
  )
}

function NavLink({
  label,
  icon: Icon,
  path,
  isActive,
}: {
  label: string
  icon: LucideIcon
  path: string
  isActive: boolean
}) {
  return (
    <Link
      href={path}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 transition-colors',
      )}
      style={{
        transitionDuration: 'var(--xm-transition-fast)',
        color: isActive ? 'var(--xm-primary)' : 'var(--xm-text-muted)',
      }}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={24} strokeWidth={isActive ? 2.2 : 1.8} />
      <span
        className={cn(
          'text-[10px] leading-tight',
          isActive ? 'font-semibold' : 'font-medium',
        )}
      >
        {label}
      </span>
    </Link>
  )
}
