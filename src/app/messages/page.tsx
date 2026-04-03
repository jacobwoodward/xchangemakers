export const dynamic = 'force-dynamic'

import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { ConversationList } from '@/components/messages/conversation-list'

export default async function MessagesPage() {
  await exchangeEngine.initialize()
  const currentMember = await exchangeEngine.getCurrentMember()
  const conversations = await exchangeEngine.getConversations(currentMember.id)

  return (
    <>
      <PageHeader title="Messages" />
      <PageTransition>
        <div className="pt-16 pb-8">
          <ConversationList
            conversations={conversations}
            currentMemberId={currentMember.id}
          />
        </div>
      </PageTransition>
    </>
  )
}
