export const dynamic = 'force-dynamic'

import { exchangeEngine } from '@/lib/exchange-engine'
import { PageTransition } from '@/components/shared/page-transition'
import { EditProfileForm } from './edit-form'

export default async function EditProfilePage() {
  await exchangeEngine.initialize()
  const member = await exchangeEngine.getCurrentMember()

  return (
    <PageTransition>
      <EditProfileForm
        firstName={member.firstName}
        lastName={member.lastName}
        vibe={member.vibe ?? ''}
        bio={member.bio ?? ''}
        avatarUrl={member.avatarUrl}
      />
    </PageTransition>
  )
}
