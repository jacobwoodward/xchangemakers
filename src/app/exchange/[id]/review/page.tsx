import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { ReviewFormWrapper } from './review-form-wrapper'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await exchangeEngine.initialize()

  const currentMember = await exchangeEngine.getCurrentMember()
  const allExchanges = await exchangeEngine.getExchanges(currentMember.id)
  const exchange = allExchanges.find((e) => e.id === id)

  if (!exchange) {
    return (
      <>
        <PageHeader title="Leave a Review" />
        <div className="pt-20 px-4 text-center">
          <p className="text-sm text-muted">Exchange not found.</p>
        </div>
      </>
    )
  }

  if (exchange.status !== 'completed') {
    return (
      <>
        <PageHeader title="Leave a Review" />
        <div className="pt-20 px-4 text-center">
          <p className="text-sm text-muted">
            Reviews can only be left after an exchange is completed.
          </p>
        </div>
      </>
    )
  }

  // Determine who the current user should review (the other party)
  const revieweeId =
    currentMember.id === exchange.providerId
      ? exchange.requesterId
      : exchange.providerId
  const reviewee = await exchangeEngine.getMember(revieweeId)

  return (
    <>
      <PageHeader title="Leave a Review" />
      <PageTransition>
        <div className="pt-16 pb-8 px-4">
          <ReviewFormWrapper
            exchange={exchange}
            reviewee={reviewee}
          />
        </div>
      </PageTransition>
    </>
  )
}
