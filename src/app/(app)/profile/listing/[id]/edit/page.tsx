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
              imageUrls: listing.imageUrls,
            }}
          />
        </div>
      </PageTransition>
    </>
  )
}
