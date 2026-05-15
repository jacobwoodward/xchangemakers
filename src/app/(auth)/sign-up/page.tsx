import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { signUpAction } from '../actions'
import { getCurrentMemberId } from '@/lib/auth/session'
import { db } from '@/db'
import { communities } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'

export default async function SignUpPage() {
  const memberId = await getCurrentMemberId()
  if (memberId) redirect('/')

  const communityOptions = await db
    .select({
      id: communities.id,
      name: communities.name,
      city: communities.city,
      region: communities.region,
    })
    .from(communities)
    .where(eq(communities.status, 'active'))
    .orderBy(asc(communities.name))

  return (
    <div className="flex min-h-dvh flex-col justify-center py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-heading">
          Start exchanging locally
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          Create a member profile, post what you need, and add what you can
          offer neighbors.
        </p>
      </div>
      <AuthForm
        mode="sign-up"
        action={signUpAction}
        communities={communityOptions}
      />
    </div>
  )
}
