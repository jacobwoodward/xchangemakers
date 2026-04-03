'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera } from 'lucide-react'
import { Button, Avatar, Card } from '@/components/ui'

interface EditProfileFormProps {
  firstName: string
  lastName: string
  vibe: string
  bio: string
  avatarUrl: string | null
}

export function EditProfileForm({
  firstName: initialFirst,
  lastName: initialLast,
  vibe: initialVibe,
  bio: initialBio,
  avatarUrl,
}: EditProfileFormProps) {
  const router = useRouter()
  const [firstName, setFirstName] = useState(initialFirst)
  const [lastName, setLastName] = useState(initialLast)
  const [vibe, setVibe] = useState(initialVibe)
  const [bio, setBio] = useState(initialBio)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => router.back(), 800)
  }

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-hover transition-colors"
        >
          <ArrowLeft size={20} style={{ color: 'var(--xm-text-heading)' }} />
        </button>
        <h1
          className="text-xl font-bold"
          style={{ color: 'var(--xm-text-heading)' }}
        >
          Edit Profile
        </h1>
      </div>

      <div className="space-y-6">
        {/* Photo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar
              src={avatarUrl}
              firstName={firstName}
              lastName={lastName}
              size="xl"
            />
            <button
              type="button"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md"
              style={{ transform: 'translate(4px, 4px)' }}
            >
              <Camera size={14} />
            </button>
          </div>
          <Button variant="ghost" size="sm">
            Change Photo
          </Button>
        </div>

        {/* Fields */}
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
          </div>

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
    </div>
  )
}
