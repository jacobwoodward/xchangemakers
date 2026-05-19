import crypto from 'node:crypto'
import postgres from 'postgres'

const baseUrl = process.env.AUTH_SMOKE_BASE_URL ?? 'http://127.0.0.1:3000'
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://xchangemakers:xchangemakers@localhost:5433/xchangemakers'

const sql = postgres(databaseUrl, { max: 1 })
const results = []

function pass(name) {
  results.push(`PASS ${name}`)
}

function fail(name, error) {
  const message = error instanceof Error ? error.message : String(error)
  results.push(`FAIL ${name}: ${message}`)
  process.exitCode = 1
}

async function check(name, fn) {
  try {
    await fn()
    pass(name)
  } catch (error) {
    fail(name, error)
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function main() {
  await check('community seeds exist', async () => {
    const [row] = await sql`SELECT count(*)::int AS count FROM communities`
    assert(row.count >= 3, `expected at least 3 communities, found ${row.count}`)
  })

  await check('invite seeds exist', async () => {
    const [row] = await sql`
      SELECT count(*)::int AS count
      FROM community_invites
      WHERE code IN ('FRIENDSWOOD', 'WEST-FRIENDSWOOD', 'PEARLAND')
    `
    assert(row.count === 3, `expected 3 demo invite codes, found ${row.count}`)
  })

  await check('members are backfilled to communities', async () => {
    const [row] = await sql`
      SELECT count(*)::int AS missing
      FROM members
      WHERE community_id IS NULL
    `
    assert(row.missing === 0, `found ${row.missing} members without community_id`)
  })

  await check('public auth routes load', async () => {
    for (const path of ['/welcome', '/sign-in', '/sign-up']) {
      const response = await fetch(`${baseUrl}${path}`)
      assert(response.status === 200, `${path} returned ${response.status}`)
    }
  })

  await check('signup exposes community and invite fields', async () => {
    const response = await fetch(`${baseUrl}/sign-up`)
    const html = await response.text()
    assert(html.includes('Friendswood'), 'signup did not render seeded communities')
    assert(html.includes('Invite Code'), 'signup did not render invite field')
  })

  await check('anonymous app route redirects to welcome', async () => {
    const response = await fetch(`${baseUrl}/`, { redirect: 'manual' })
    assert(
      response.status === 307 || response.status === 308,
      `expected redirect, got ${response.status}`,
    )
    assert(
      response.headers.get('location')?.includes('/welcome'),
      `unexpected location ${response.headers.get('location')}`,
    )
  })

  await check('session cookie opens protected routes', async () => {
    const [account] = await sql`
      SELECT id FROM auth_accounts ORDER BY created_at LIMIT 1
    `
    assert(account?.id, 'no auth account found')

    const token = crypto.randomBytes(32).toString('base64url')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    await sql`
      INSERT INTO auth_sessions (account_id, token_hash, expires_at)
      VALUES (${account.id}, ${tokenHash}, now() + interval '1 hour')
    `

    try {
      for (const path of ['/', '/profile', '/messages']) {
        const response = await fetch(`${baseUrl}${path}`, {
          headers: { cookie: `xm_session=${token}` },
          redirect: 'manual',
        })
        assert(response.status === 200, `${path} returned ${response.status}`)
      }
    } finally {
      await sql`DELETE FROM auth_sessions WHERE token_hash = ${tokenHash}`
    }
  })
}

await main().finally(async () => {
  await sql.end()
  console.log(results.join('\n'))
})
