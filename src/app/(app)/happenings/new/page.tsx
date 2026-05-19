import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { HappeningForm } from '@/components/happenings/happening-form'

export default function NewHappeningPage() {
  return (
    <>
      <PageHeader title="Create Event" />
      <PageTransition>
        <div className="px-4 pt-20 pb-6">
          <HappeningForm />
        </div>
      </PageTransition>
    </>
  )
}
