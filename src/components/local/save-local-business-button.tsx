'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/ui'

export function SaveLocalBusinessButton() {
  const [saved, setSaved] = useState(false)
  const Icon = saved ? BookmarkCheck : Bookmark

  return (
    <Button
      type="button"
      variant={saved ? 'primary' : 'secondary'}
      size="sm"
      onClick={() => setSaved((value) => !value)}
      aria-pressed={saved}
    >
      <Icon size={15} />
      {saved ? 'Saved' : 'Save'}
    </Button>
  )
}
