export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { exchangeEngine } from '@/lib/exchange-engine'
import { PageTransition } from '@/components/shared/page-transition'
import { Card, Button } from '@/components/ui'
import { StewardConsole } from '@/components/steward/steward-console'

export default async function StewardPage() {
  await exchangeEngine.initialize()

  try {
    const dashboard = await exchangeEngine.getStewardDashboard()
    return (
      <PageTransition>
        <StewardConsole dashboard={dashboard} />
      </PageTransition>
    )
  } catch (error) {
    return (
      <PageTransition>
        <div className="px-4 pt-12 pb-6 space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hover">
                <ShieldAlert size={18} className="text-secondary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-heading">
                  Steward access required
                </h1>
                <p className="text-sm text-secondary">
                  This workspace is only available to community operators.
                </p>
              </div>
            </div>
            <Link href="/profile">
              <Button variant="secondary" className="w-full">
                Back to profile
              </Button>
            </Link>
          </Card>
          {error instanceof Error && (
            <p className="text-center text-xs text-muted">{error.message}</p>
          )}
        </div>
      </PageTransition>
    )
  }
}
