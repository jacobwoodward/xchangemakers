import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { signInAction } from '../actions'
import { getCurrentMemberId } from '@/lib/auth/session'

export default async function SignInPage() {
  const memberId = await getCurrentMemberId()
  if (memberId) redirect('/')

  return (
    <div className="flex min-h-dvh flex-col justify-center py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-heading">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          Sign in to see your needs, offers, exchanges, and messages.
        </p>
      </div>
      <AuthForm mode="sign-in" action={signInAction} />
    </div>
  )
}
