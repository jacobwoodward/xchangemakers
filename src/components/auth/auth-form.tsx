'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import type { AuthActionState } from '@/app/(auth)/actions'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
  communities?: Array<{
    id: string
    name: string
    city: string
    region: string
  }>
  action: (
    prevState: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>
}

const initialState: AuthActionState = {}

export function AuthForm({ mode, communities = [], action }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState)
  const isSignUp = mode === 'sign-up'

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-error/15 bg-error/8 px-3 py-2.5">
          <AlertCircle size={16} className="shrink-0 text-error" />
          <p className="text-xs font-medium text-error">{state.error}</p>
        </div>
      )}

      <Card className="space-y-4">
        {isSignUp && (
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                First Name
              </span>
              <input
                name="firstName"
                type="text"
                autoComplete="given-name"
                className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Last Name
              </span>
              <input
                name="lastName"
                type="text"
                autoComplete="family-name"
                className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </label>
          </div>
        )}

        <label className="block space-y-1.5">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Password
          </span>
          <input
            name="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </label>

        {isSignUp && (
          <>
            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Community
              </span>
              <select
                name="communityId"
                defaultValue={communities[0]?.id}
                className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              >
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}, {community.city}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Invite Code
              </span>
              <input
                name="inviteCode"
                type="text"
                placeholder="Optional"
                autoComplete="off"
                className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm uppercase text-body outline-none transition-colors placeholder:normal-case focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
              <span className="block text-xs leading-relaxed text-muted">
                Use this if a steward or neighbor invited you into a private community.
              </span>
            </label>

            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Starting Path
              </span>
              <select
                name="membershipType"
                defaultValue="standard"
                className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              >
                <option value="standard">Neighbor</option>
                <option value="business">Local business</option>
                <option value="community_contribution">Community contributor</option>
              </select>
            </label>
          </>
        )}
      </Card>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isPending}
      >
        {isSignUp ? 'Create Account' : 'Sign In'}
        <ArrowRight size={18} />
      </Button>

      <p className="text-center text-sm text-muted">
        {isSignUp ? 'Already a member?' : 'New here?'}{' '}
        <Link
          href={isSignUp ? '/sign-in' : '/sign-up'}
          className="font-medium text-primary hover:underline"
        >
          {isSignUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  )
}
