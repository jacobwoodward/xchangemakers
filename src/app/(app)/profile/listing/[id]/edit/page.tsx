export const dynamic = 'force-dynamic'

import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { ListingForm } from '@/components/profile/listing-form'
import { exchangeEngine } from '@/lib/exchange-engine'
import { notFound } from 'next/navigation'

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await exchangeEngine.initialize()

  let listing
  try {
    listing = await exchangeEngine.getListing(id)
  } catch {
    notFound()
  }
  const windows =
    listing.type === 'need'
      ? await exchangeEngine.getNeedWindowsForListing(listing.id, {
          activeOnly: true,
        })
      : []

  return (
    <>
      <PageHeader title="Edit listing" />
      <PageTransition>
        <div className="pt-16 pb-16 px-4 space-y-5">
          <ListingForm
            mode="edit"
            listingId={listing.id}
            initialValues={{
              type: listing.type,
              title: listing.title,
              description: listing.description,
              category: listing.category,
              creditPrice: listing.creditPrice,
              availabilityType: listing.availabilityType,
              needStatus: listing.needStatus,
              publicLocationLabel: listing.publicLocationLabel,
              exactLocation: listing.exactLocation,
              isLocationPrivate: listing.isLocationPrivate,
              isUrgent: listing.isUrgent,
              recurringNote: listing.recurringNote,
              imageUrls: listing.imageUrls,
              windows: windows.map((window) => ({
                id: window.id,
                startsAt: window.startsAt,
                endsAt: window.endsAt,
                label: window.label,
                isFlexible: window.isFlexible,
              })),
            }}
          />
        </div>
      </PageTransition>
    </>
  )
}
