import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { MemberHeader } from '@/components/profile/member-header'
import { ReputationTags } from '@/components/profile/reputation-tags'
import { OfferingsList } from '@/components/profile/offerings-list'
import { AvailabilityDisplay } from '@/components/profile/availability-display'
import { ActionBar } from '@/components/profile/action-bar'

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await exchangeEngine.initialize()
  const member = await exchangeEngine.getMember(id)
  const availability = await exchangeEngine.getAvailability(id)
  const firstListingId = member.offerings.length > 0 ? member.offerings[0].id : null

  return (
    <>
      <PageHeader title={member.firstName} />
      <PageTransition>
        <div className="pt-16 pb-24 px-4 space-y-6">
          <MemberHeader member={member} />
          {member.reputationTags.length > 0 && (
            <ReputationTags tags={member.reputationTags} />
          )}
          <OfferingsList offerings={member.offerings} needs={member.needs} />
          {availability.length > 0 && (
            <AvailabilityDisplay slots={availability} />
          )}
        </div>
      </PageTransition>
      <ActionBar memberId={id} firstListingId={firstListingId} />
    </>
  )
}
