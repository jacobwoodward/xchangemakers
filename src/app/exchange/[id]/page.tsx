import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { ExchangeRoom } from '@/components/exchange/exchange-room'

export default async function ExchangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await exchangeEngine.initialize()

  let room
  try {
    room = await exchangeEngine.getExchangeRoom(id)
  } catch (error) {
    console.error('Failed to load exchange room', error)
    room = null
  }

  if (!room) {
    return (
      <>
        <PageHeader title="Exchange" />
        <div className="pt-20 px-4 text-center">
          <p className="text-sm text-muted">Exchange not found.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Exchange Room" />
      <PageTransition>
        <div className="pt-16 pb-safe-bottom px-4">
          <ExchangeRoom room={room} />
        </div>
      </PageTransition>
    </>
  )
}
