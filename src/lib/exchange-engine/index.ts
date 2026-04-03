// ---------------------------------------------------------------------------
// Exchange Engine — Barrel Export
// ---------------------------------------------------------------------------
// IMPORTANT: This barrel is imported by server components. Client components
// should only import types (via `import type`) from this file.
// The store and client are re-exported here for server-side use only.
// ---------------------------------------------------------------------------

export * from './types'
export { exchangeEngine } from './client'
