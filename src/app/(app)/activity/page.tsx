import { exchangeEngine } from '@/lib/exchange-engine'
import { PageTransition } from '@/components/shared/page-transition'
import { ActivityList } from '@/components/activity/activity-list'
import { CaughtUpCard } from '@/components/activity/caught-up-card'

export default async function ActivityPage() {
  await exchangeEngine.initialize()
  const { items, hasMore } = await exchangeEngine.getActivityFeed()

  return (
    <PageTransition>
      <div className="px-4 pt-4 pb-6">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--xm-text-heading)' }}>
          Activity
        </h1>
        <ActivityList items={items} />
        {!hasMore && <CaughtUpCard />}
      </div>
    </PageTransition>
  )
}
