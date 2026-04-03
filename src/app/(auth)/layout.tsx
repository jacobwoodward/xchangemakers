export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--xm-bg-page)' }}>
      <main
        className="mx-auto px-4 py-6"
        style={{ maxWidth: 'var(--xm-content-max-width)' }}
      >
        {children}
      </main>
    </div>
  )
}
