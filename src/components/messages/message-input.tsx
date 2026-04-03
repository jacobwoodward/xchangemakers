'use client'

import { useState, useRef } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSend: (content: string) => void
  isLoading: boolean
}

export function MessageInput({ onSend, isLoading }: MessageInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const canSend = value.trim().length > 0 && !isLoading

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSend) return

    const content = value.trim()
    setValue('')
    onSend(content)

    // Refocus input after send
    inputRef.current?.focus()
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface"
      style={{
        borderColor: 'var(--xm-border-light)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex items-center gap-2 px-3 py-2"
        style={{ maxWidth: 'var(--xm-content-max-width)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Message..."
          disabled={isLoading}
          autoComplete="off"
          className={cn(
            'flex-1 h-10 px-4 text-[15px] rounded-full',
            'bg-hover text-body placeholder:text-muted',
            'outline-none transition-colors duration-[var(--xm-transition-fast)]',
            'focus:ring-2 focus:ring-primary/20',
            'disabled:opacity-50',
          )}
        />
        <button
          type="submit"
          disabled={!canSend}
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            'transition-all duration-[var(--xm-transition-fast)]',
            canSend
              ? 'bg-primary text-primary-foreground shadow-sm active:scale-95'
              : 'bg-hover text-muted',
          )}
          aria-label="Send message"
        >
          <Send size={18} className={canSend ? '' : 'opacity-50'} />
        </button>
      </form>
    </div>
  )
}
