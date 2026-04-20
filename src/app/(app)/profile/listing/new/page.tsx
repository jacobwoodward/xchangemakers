import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { ListingForm } from '@/components/profile/listing-form'
import type { ListingType } from '@/lib/exchange-engine'

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams
  const type: ListingType = params.type === 'need' ? 'need' : 'offering'

  const title = type === 'offering' ? 'New offering' : 'Post a need'
  const subtitle =
    type === 'offering'
      ? 'Share what you can offer your neighbors'
      : 'Tell your community what you\u2019re looking for'

  return (
    <>
      <PageHeader title={title} />
      <PageTransition>
        <div className="pt-16 pb-16 px-4 space-y-5">
          <p className="text-sm text-secondary">{subtitle}</p>
          <ListingForm mode="create" defaultType={type} />
        </div>
      </PageTransition>
    </>
  )
}
