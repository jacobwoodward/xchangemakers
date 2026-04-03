import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { ThreadClient } from '@/components/messages/thread-client'
import type { Member } from '@/lib/exchange-engine'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await exchangeEngine.initialize()

  const currentMember = await exchangeEngine.getCurrentMember()
  const conversations = await exchangeEngine.getConversations(currentMember.id)
  const conversation = conversations.find((c) => c.id === id)

  if (!conversation) {
    return (
      <>
        <PageHeader title="Message" />
        <div className="pt-20 px-4 text-center">
          <p className="text-sm text-muted">Conversation not found.</p>
        </div>
      </>
    )
  }

  // Find the other participant for the header title
  const otherParticipant = conversation.participants.find(
    (p) => p.memberId !== currentMember.id,
  )
  const otherName = otherParticipant?.member
    ? `${otherParticipant.member.firstName} ${otherParticipant.member.lastName}`
    : 'Message'

  // Load messages
  const messages = await exchangeEngine.getMessages(id)

  // Build participants record (plain object — serializable across RSC boundary)
  const participantsRecord: Record<string, Member> = {}
  for (const p of conversation.participants) {
    if (p.member) {
      participantsRecord[p.memberId] = p.member
    }
  }

  return (
    <>
      <PageHeader title={otherName} />
      <ThreadClient
        conversationId={id}
        initialMessages={messages}
        currentMemberId={currentMember.id}
        participants={participantsRecord}
      />
    </>
  )
}
