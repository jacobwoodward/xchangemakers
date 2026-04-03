import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { BookingForm } from '@/components/exchange/booking-form'

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await exchangeEngine.initialize()

  // Load listing, provider, their availability, and current user wallet
  const listing = await exchangeEngine.getListing(id)
  const provider = listing.member
    ? listing.member
    : (await exchangeEngine.getMember(listing.memberId))

  const availability = await exchangeEngine.getAvailability(listing.memberId)
  const currentMember = await exchangeEngine.getCurrentMember()
  const wallet = await exchangeEngine.getWallet(currentMember.id)

  return (
    <>
      <PageHeader title="Book Exchange" />
      <PageTransition>
        <div className="pt-16 pb-8 px-4">
          <BookingForm
            listing={listing}
            provider={provider}
            availability={availability}
            walletBalance={wallet.balance}
          />
        </div>
      </PageTransition>
    </>
  )
}
