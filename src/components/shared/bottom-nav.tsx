'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Calendar, Activity, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Search', icon: Search, path: '/search' },
  { label: 'Happenings', icon: Calendar, path: '/happenings' },
  { label: 'Activity', icon: Activity, path: '/activity' },
  { label: 'Profile', icon: User, path: '/profile' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
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
        {tabs.map(({ label, icon: Icon, path }) => {
          const isActive =
            path === '/' ? pathname === '/' : pathname.startsWith(path)

          return (
            <Link
              key={path}
              href={path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5',
                'transition-colors',
              )}
              style={{
                transitionDuration: 'var(--xm-transition-fast)',
                color: isActive
                  ? 'var(--xm-primary)'
                  : 'var(--xm-text-muted)',
              }}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
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
        })}
      </div>
    </nav>
  )
}
