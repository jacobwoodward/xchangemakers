import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'

const repo = process.cwd()
const pgPort = Number(process.env.DEV_STACK_PG_PORT ?? 5433)
const preferredAppPort = Number(process.env.PORT ?? process.env.DEV_STACK_APP_PORT ?? 3000)
const pgData = path.join(repo, '.postgres-data')
const pgBin = 'C:/Program Files/PostgreSQL/17/bin/postgres.exe'
const pgCtl = 'C:/Program Files/PostgreSQL/17/bin/pg_ctl.exe'
const pgReady = 'C:/Program Files/PostgreSQL/17/bin/pg_isready.exe'
const databaseUrl = `postgres://xchangemakers:xchangemakers@127.0.0.1:${pgPort}/xchangemakers`
const statePath = path.join(repo, 'codex-dev-server.current.json')
const lifecyclePath = path.join(repo, 'codex-dev-server.current.lifecycle.log')
const heartbeatPath = path.join(repo, 'codex-dev-server.current.heartbeat')

function lifecycle(message) {
  fs.appendFileSync(lifecyclePath, `${new Date().toISOString()} ${message}\n`)
}

function logFile(name) {
  return fs.openSync(path.join(repo, `codex-dev-server.current.${name}.log`), 'a')
}

function canConnect(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host })
    socket.once('connect', () => {
      socket.end()
      resolve(true)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

async function waitForPort(port, timeoutMs = 45000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (await canConnect(port)) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timed out waiting for port ${port}`)
}

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: 'ignore',
      ...options,
    })
    child.on('exit', (code) => resolve(code ?? 1))
    child.on('error', () => resolve(1))
  })
}

async function waitForPostgres(timeoutMs = 45000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const code = await run(pgReady, [
      '-h',
      '127.0.0.1',
      '-p',
      String(pgPort),
      '-U',
      'xchangemakers',
      '-d',
      'xchangemakers',
    ])
    if (code === 0) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Timed out waiting for Postgres readiness')
}

async function chooseAppPort() {
  for (const port of [preferredAppPort, 3001, 3036, 3037, 3038]) {
    if (!(await canConnect(port))) return port
  }
  throw new Error('No dev app port is available')
}

let postgresProcess = null
let nextProcess = null
let stopping = false
let keepAlive = null

async function stop() {
  if (stopping) return
  stopping = true
  lifecycle('stopping dev stack')

  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill('SIGTERM')
  }

  await run(pgCtl, ['stop', '-D', pgData, '-m', 'fast'])
  process.exit(0)
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
process.on('exit', (code) => {
  try {
    lifecycle(`helper exited with code ${code}`)
  } catch {
    // Process exit hooks must remain best-effort.
  }
})
process.on('uncaughtException', (error) => {
  lifecycle(`uncaught exception: ${error.stack ?? error.message}`)
  process.exit(1)
})
process.on('unhandledRejection', (error) => {
  lifecycle(`unhandled rejection: ${error?.stack ?? error}`)
  process.exit(1)
})

async function main() {
  const appPort = await chooseAppPort()
  const pgAlreadyRunning = await canConnect(pgPort)

  if (!pgAlreadyRunning) {
    postgresProcess = spawn(pgBin, ['-D', pgData, '-p', String(pgPort)], {
      cwd: repo,
      stdio: ['ignore', logFile('pg'), logFile('pg.err')],
    })
    postgresProcess.on('exit', (code, signal) => {
      lifecycle(`postgres exited code=${code ?? ''} signal=${signal ?? ''}`)
    })
  }

  await waitForPostgres()

  nextProcess = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'dev', '-H', '127.0.0.1', '-p', String(appPort)],
    {
      cwd: repo,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        AUTH_SMOKE_BASE_URL: `http://127.0.0.1:${appPort}`,
      },
      stdio: ['ignore', logFile('app'), logFile('app.err')],
    },
  )
  nextProcess.on('exit', (code, signal) => {
    lifecycle(`next exited code=${code ?? ''} signal=${signal ?? ''}`)
  })

  await waitForPort(appPort)

  fs.writeFileSync(
    statePath,
    JSON.stringify(
      {
        url: `http://127.0.0.1:${appPort}`,
        appPort,
        pgPort,
        helperPid: process.pid,
        nextPid: nextProcess.pid,
        postgresPid: postgresProcess?.pid ?? null,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  )

  lifecycle(`dev stack ready url=http://127.0.0.1:${appPort}`)
  keepAlive = setInterval(() => {
    fs.writeFileSync(heartbeatPath, new Date().toISOString())
  }, 5_000)
  keepAlive.ref()
}

main().catch((error) => {
  lifecycle(`startup failed: ${error.stack ?? error.message}`)
  fs.writeFileSync(
    path.join(repo, 'codex-dev-server.current.error.log'),
    `${error.stack ?? error.message}\n`,
  )
  process.exit(1)
})
