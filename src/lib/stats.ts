import { GameStats } from './localStorage'

export const emptyStats = (): GameStats => ({
  winDistribution: [0, 0, 0, 0, 0, 0],
  gamesFailed: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalGames: 0,
  successRate: 0,
})

// Pure: persistence belongs to the same atomic record as the final guess.
export function addStatsForCompletedGame(
  gameStats: GameStats,
  count: number,
): GameStats {
  const stats = {
    ...gameStats,
    winDistribution: [...gameStats.winDistribution],
  }
  stats.totalGames += 1
  if (count >= 6) {
    stats.currentStreak = 0
    stats.gamesFailed += 1
  } else {
    stats.winDistribution[count] += 1
    stats.currentStreak += 1
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak)
  }
  stats.successRate = Math.round(
    (100 * (stats.totalGames - stats.gamesFailed)) / stats.totalGames,
  )
  return stats
}
