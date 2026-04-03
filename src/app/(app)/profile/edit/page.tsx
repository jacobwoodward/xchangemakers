'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { Card, Avatar, Button } from '@/components/ui'
import { Camera } from 'lucide-react'
import { useExchangeStore } from '@/lib/exchange-engine'

export default function EditProfilePage() {
  const router = useRouter()
  const member = useExchangeStore((s) => s.currentMember)

  const [firstName, setFirstName] = useState(member?.firstName ?? '')
  const [lastName, setLastName] = useState(member?.lastName ?? '')
  const [vibe, setVibe] = useState(member?.vibe ?? '')
  const [bio, setBio] = useState(member?.bio ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    // Prototype — simulate save then navigate back
    setTimeout(() => {
      router.back()
    }, 800)
  }

  return (
    <>
      <PageHeader title="Edit Profile" />
      <PageTransition>
        <div className="pt-16 pb-8 px-4 space-y-6">
          {/* ---- Photo ---- */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar
                src={member?.avatarUrl ?? null}
                firstName={firstName}
                lastName={lastName}
                size="xl"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
              >
                <Camera size={14} />
              </button>
            </div>
            <Button variant="ghost" size="sm">
              Change Photo
            </Button>
          </div>

          {/* ---- Fields ---- */}
          <Card className="space-y-4">
            {/* First name */}
            <div className="space-y-1.5">
              <label
                htmlFor="firstName"
                className="block text-xs font-semibold uppercase tracking-wider text-muted"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Last name */}
            <div className="space-y-1.5">
              <label
                htmlFor="lastName"
                className="block text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Vibe tagline */}
            <div className="space-y-1.5">
              <label
                htmlFor="vibe"
                className="block text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Vibe Tagline
              </label>
              <input
                id="vibe"
                type="text"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="What makes you, you?"
                className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted/50 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label
                htmlFor="bio"
                className="block text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your neighbors a bit about yourself..."
                rows={4}
                className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted/50 outline-none transition-colors resize-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </Card>

          {/* ---- Save button ---- */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSave}
            isLoading={saving}
          >
            Save Changes
          </Button>
        </div>
      </PageTransition>
    </>
  )
}
