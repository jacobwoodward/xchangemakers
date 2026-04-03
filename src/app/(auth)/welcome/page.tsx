import Link from 'next/link'
import { Handshake } from 'lucide-react'

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 -mt-6 text-center">
      {/* Logo / wordmark */}
      <h1 className="text-2xl font-bold tracking-tight text-heading mb-1">
        xChangeMakers
      </h1>
      <p className="text-sm text-secondary mb-10">
        Exchange skills, build community
      </p>

      {/* Illustration area */}
      <div className="relative mb-10">
        {/* Decorative rings */}
        <div
          className="absolute -inset-6 rounded-full opacity-[0.07]"
          style={{ backgroundColor: 'var(--xm-primary)' }}
        />
        <div
          className="absolute -inset-3 rounded-full opacity-[0.05]"
          style={{ backgroundColor: 'var(--xm-accent)' }}
        />

        <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-primary/10">
          <Handshake
            className="w-14 h-14 text-primary"
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-body text-[15px] leading-relaxed max-w-[300px] mb-12">
        Join your neighbors in building a local exchange network. No money
        needed — just energy, skills, and generosity.
      </p>

      {/* CTA */}
      <div className="w-full max-w-[280px] space-y-4">
        <Link
          href="/onboarding"
          className="flex items-center justify-center w-full h-12 rounded-full bg-primary text-primary-foreground font-medium text-base shadow-sm hover:bg-primary-dark active:bg-primary-dark transition-colors"
        >
          Get Started
        </Link>

        <p className="text-sm text-muted">
          Already a member?{' '}
          <Link href="#" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
