import { expect, test, Page } from '@playwright/test'
import { WORDS_1, WORDS_2 } from '../../src/constants/wordlist'
const time = new Date('2026-11-09T20:00:00Z')
const index =
  3 +
  Math.floor(
    (time.valueOf() - new Date('2022-01-01T08:00:00Z').valueOf()) / 86400000,
  )
const pair = {
  solution_A: WORDS_1[index % WORDS_1.length].toUpperCase(),
  solution_B: WORDS_2[index % WORDS_2.length].toUpperCase(),
}
const legacyStats = {
  winDistribution: [1, 2, 3, 4, 5, 6],
  gamesFailed: 2,
  currentStreak: 7,
  bestStreak: 14,
  totalGames: 23,
  successRate: 91,
}
async function seed(page: Page, guesses: string[] = []) {
  await page.clock.setFixedTime(time)
  await page.goto('/')
  await page.evaluate(
    ({ pair, legacyStats, guesses }) => {
      localStorage.setItem('gameState', JSON.stringify({ ...pair, guesses }))
      localStorage.setItem('gameStats', JSON.stringify(legacyStats))
    },
    { pair, legacyStats, guesses },
  )
  await page.reload()
}
async function enter(page: Page, word: string) {
  await page.locator('h1').click()
  await page.keyboard.type(word)
  await page.keyboard.press('Enter')
}
const saved = (page: Page, mode = 'classic') =>
  page.evaluate(
    (mode) => JSON.parse(localStorage.getItem(`qwordle:v2:${mode}`) || 'null'),
    mode,
  )
const original = (page: Page) =>
  page.evaluate(() => [
    localStorage.getItem('gameState'),
    localStorage.getItem('gameStats'),
  ])

test('legacy streak survives win, bonus, refresh and mode changes', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await seed(page, ['CRANE'])
  const before = await original(page)
  await page.getByRole('checkbox').check()
  await enter(page, pair.solution_A)
  await expect(
    page.getByRole('region', { name: 'Bonus turn', exact: true }),
  ).toBeVisible()
  await expect(page.getByText(/The words were/)).toHaveCount(0)
  expect((await saved(page)).stats.currentStreak).toBe(8)
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'Bonus turn', exact: true }),
  ).toBeVisible()
  await enter(page, pair.solution_B)
  await expect(page.getByText('Both words found!')).toBeVisible()
  expect((await saved(page)).stats.totalGames).toBe(24)
  const classic = await saved(page)
  await page.getByRole('button', { name: 'Fresh daily', exact: true }).click()
  await enter(page, 'CRANE')
  await expect
    .poll(async () => (await saved(page, 'fresh'))?.guesses)
    .toEqual(['CRANE'])
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await enter(page, 'CRANE')
  await expect
    .poll(async () => (await saved(page, 'practice'))?.guesses)
    .toEqual(['CRANE'])
  await page.getByRole('button', { name: 'New practice puzzle' }).click()
  await expect
    .poll(async () => (await saved(page, 'practice'))?.guesses)
    .toEqual([])
  await page.getByRole('button', { name: 'Classic', exact: true }).click()
  await expect(page.getByText('Solved in 2/6!')).toBeVisible()
  expect(await original(page)).toEqual(before)
  expect(await saved(page)).toEqual(classic)
  expect(errors).toEqual([])
})

test('completed legacy games are never counted again', async ({ page }) => {
  await seed(page, [pair.solution_A])
  const before = await original(page)
  await expect(page.getByText('Solved in 1/6!')).toBeVisible()
  await enter(page, pair.solution_B)
  await page.reload()
  expect(await saved(page)).toBeNull()
  expect(await original(page)).toEqual(before)
})

test('sixth-turn win gets exactly one bonus, with safe duplicate Enter handling', async ({
  page,
}) => {
  await seed(page, ['CRANE', 'CRANE', 'CRANE', 'CRANE', 'CRANE'])
  await page.getByRole('checkbox').check()
  await enter(page, pair.solution_A)
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('region', { name: 'Bonus turn', exact: true }),
  ).toBeVisible()
  await enter(page, 'CRANE')
  await expect(
    page.getByText('Bonus turn complete. Your original win still counts.'),
  ).toBeVisible()
  await enter(page, pair.solution_B)
  const progress = await saved(page)
  expect(progress.guesses).toHaveLength(6)
  expect(progress.stats.totalGames).toBe(24)
  expect(progress.stats.winDistribution[5]).toBe(7)
  expect(progress.bonus.guess).toBe('CRANE')
})

test('a normal loss updates the streak once and offers no bonus', async ({
  page,
}) => {
  await seed(page, ['CRANE', 'CRANE', 'CRANE', 'CRANE', 'CRANE'])
  await page.getByRole('checkbox').check()
  await enter(page, 'CRANE')
  await expect(
    page.getByText('This puzzle is complete.', { exact: true }),
  ).toBeVisible()
  expect((await saved(page)).stats.currentStreak).toBe(0)
  expect((await saved(page)).stats.gamesFailed).toBe(3)
  await page.reload()
  expect((await saved(page)).stats.totalGames).toBe(24)
  await expect(
    page.getByRole('region', { name: 'Bonus turn', exact: true }),
  ).toHaveCount(0)
})

test('malformed statistics stay untouched and practice remains available', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('gameStats', '{invalid'))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText(
    'existing data has been kept',
  )
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await enter(page, 'CRANE')
  await expect
    .poll(async () => (await saved(page, 'practice'))?.guesses)
    .toEqual(['CRANE'])
  expect(await page.evaluate(() => localStorage.getItem('gameStats'))).toBe(
    '{invalid',
  )
})

test('storage quota failure cannot consume a guess or overwrite a streak', async ({
  page,
}) => {
  await seed(page)
  const before = await original(page)
  await page.evaluate(() => {
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'qwordle:v2:classic')
        throw new DOMException('Storage is full', 'QuotaExceededError')
      set.call(this, key, value)
    }
  })
  await enter(page, pair.solution_A)
  await expect(page.getByRole('alert')).toContainText('Storage is full')
  expect(await original(page)).toEqual(before)
  expect(await saved(page)).toBeNull()
  await page.reload()
  await enter(page, pair.solution_A)
  await expect(page.getByText('Solved in 1/6!')).toBeVisible()
  expect((await saved(page)).stats.totalGames).toBe(24)
})

test('two tabs cannot count the same win twice', async ({ page, context }) => {
  await seed(page)
  const second = await context.newPage()
  await second.clock.setFixedTime(time)
  await second.goto('/')
  await Promise.all([
    enter(page, pair.solution_A),
    enter(second, pair.solution_B),
  ])
  await expect.poll(async () => (await saved(page))?.stats.totalGames).toBe(24)
  await Promise.all([page.reload(), second.reload()])
  await expect(page.getByText('Solved in 1/6!')).toBeVisible()
  await expect(second.getByText('Solved in 1/6!')).toBeVisible()
  expect((await saved(second)).stats.currentStreak).toBe(8)
})

test('rollover blocks an old puzzle and retains statistics for the next one', async ({
  page,
}) => {
  await seed(page)
  await enter(page, 'CRANE')
  await expect.poll(async () => (await saved(page))?.guesses).toEqual(['CRANE'])
  const before = await saved(page)
  await page.clock.setFixedTime(new Date(time.valueOf() + 86400000))
  await expect(
    page.getByText('A new daily puzzle is available.', { exact: false }),
  ).toBeVisible()
  await enter(page, pair.solution_A)
  expect(await saved(page)).toEqual(before)
  await page.getByRole('button', { name: 'Reload game' }).click()
  expect(await saved(page)).toEqual(before)
  await enter(page, 'CRANE')
  await expect
    .poll(async () => (await saved(page))?.puzzle.number)
    .toBe(index + 1)
  expect((await saved(page)).stats).toEqual(legacyStats)
})

test('keyboard input is isolated from dialogs and preferences persist', async ({
  page,
}) => {
  await seed(page)
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('heading', { name: 'Settings', exact: true }).click()
  await page.keyboard.type(pair.solution_A)
  await page.keyboard.press('Enter')
  expect(await saved(page)).toBeNull()
  await page.getByRole('switch', { name: 'Dark Mode' }).click()
  await page.getByRole('switch', { name: 'High Contrast Mode' }).click()
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('html')).toHaveClass(/high-contrast/)
  expect(await saved(page)).toBeNull()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(overflow).toBe(false)
})

test('transfer link previews, imports into an empty browser, and refuses overwrite', async ({
  page,
  browser,
}) => {
  await seed(page, ['CRANE'])
  await enter(page, pair.solution_A)
  await page.getByRole('link', { name: 'Transfer / backup' }).click()
  await page.getByRole('button', { name: 'Create transfer link' }).click()
  const link = await page
    .getByRole('textbox', { name: 'Transfer link' })
    .inputValue()
  const receiver = await browser.newContext({
    timezoneId: 'America/Los_Angeles',
  })
  const other = await receiver.newPage()
  await other.clock.setFixedTime(time)
  await other.goto(link)
  expect(await saved(other)).toBeNull()
  await other.getByRole('button', { name: 'Import classic progress' }).click()
  await expect(other.getByRole('status')).toContainText('imported successfully')
  const imported = await saved(other)
  expect(imported.stats.currentStreak).toBe(8)
  await other.goto(link)
  await other.getByRole('button', { name: 'Import classic progress' }).click()
  await expect(other.getByRole('status')).toContainText(
    'already has classic progress',
  )
  expect(await saved(other)).toEqual(imported)
  await receiver.close()
})

test('physical typing works immediately after mode and bonus controls', async ({
  page,
}) => {
  await seed(page)
  await page.getByRole('button', { name: 'Fresh daily', exact: true }).click()
  await page.keyboard.type('CRANE')
  await page.keyboard.press('Enter')
  await expect
    .poll(async () => (await saved(page, 'fresh'))?.guesses)
    .toEqual(['CRANE'])
  await page.getByRole('button', { name: 'Classic', exact: true }).click()
  await page.getByRole('checkbox').check()
  await page.keyboard.type(pair.solution_A)
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('region', { name: 'Bonus turn', exact: true }),
  ).toBeVisible()
})
