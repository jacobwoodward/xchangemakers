import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { HappeningDetail } from '@/components/happenings/happening-detail'
import { RsvpSummary } from '@/components/happenings/rsvp-summary'
import { HappeningDetailFooter } from './footer'

export default async function HappeningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await exchangeEngine.initialize()
  const happening = await exchangeEngine.getHappening(id)

  // For the attendees preview, we load the members who RSVP'd going.
  // In prototype mode we use the seeded members as stand-ins.
  const allMembers = await exchangeEngine.getMembers()
  // Show a slice of members as "attendees" based on goingCount
  const attendees = allMembers.slice(0, happening.goingCount)

  return (
    <>
      <PageHeader title="Happening" />
      <PageTransition>
        <div className="pt-16 pb-28 px-4">
          <HappeningDetail
            happening={happening}
            attendees={attendees}
          />

          {/* ─── RSVP summary ─── */}
          <div className="mt-5">
            <RsvpSummary
              goingCount={happening.goingCount}
              interestedCount={happening.interestedCount}
            />
          </div>
        </div>
      </PageTransition>

      {/* ─── Sticky RSVP footer ─── */}
      <HappeningDetailFooter happeningId={happening.id} />
    </>
  )
}
