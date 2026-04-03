import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { ExchangeStatusCard } from '@/components/exchange/exchange-status-card'
import { CompletionCard } from '@/components/exchange/completion-card'

export default async function ExchangeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ booked?: string; completed?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  await exchangeEngine.initialize()

  // Load the exchange with related data
  const currentMember = await exchangeEngine.getCurrentMember()
  const allExchanges = await exchangeEngine.getExchanges(currentMember.id)
  const exchange = allExchanges.find((e) => e.id === id)

  if (!exchange) {
    return (
      <>
        <PageHeader title="Exchange" />
        <div className="pt-20 px-4 text-center">
          <p className="text-sm text-muted">Exchange not found.</p>
        </div>
      </>
    )
  }

  // If just completed, show celebration card
  if (exchange.status === 'completed' && query.completed === '1') {
    const provider = exchange.provider ?? await exchangeEngine.getMember(exchange.providerId)
    const requester = exchange.requester ?? await exchangeEngine.getMember(exchange.requesterId)

    return (
      <>
        <PageHeader title="Exchange Complete" />
        <PageTransition>
          <div className="pt-16">
            <CompletionCard
              exchange={exchange}
              provider={provider}
              requester={requester}
            />
          </div>
        </PageTransition>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Exchange" />
      <PageTransition>
        <div className="pt-16 pb-8 px-4">
          <ExchangeStatusCard
            exchange={exchange}
            currentMemberId={currentMember.id}
          />
        </div>
      </PageTransition>
    </>
  )
}
