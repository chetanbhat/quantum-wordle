import { spawnSync } from 'node:child_process'

const zones = [
  'UTC',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Asia/Kolkata',
  'Australia/Lord_Howe',
  'Pacific/Auckland',
  'Pacific/Honolulu',
]
for (const TZ of zones) {
  console.log(`Classic compatibility: ${TZ}`)
  const result = spawnSync(
    process.execPath,
    ['node_modules/vitest/vitest.mjs', 'run', 'tests/compatibility.test.ts'],
    { env: { ...process.env, TZ }, stdio: 'inherit' },
  )
  if (result.status !== 0) process.exit(result.status || 1)
}
