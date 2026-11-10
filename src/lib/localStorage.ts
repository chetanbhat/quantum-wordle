export type GameStats = {
  winDistribution: number[]
  gamesFailed: number
  currentStreak: number
  bestStreak: number
  totalGames: number
  successRate: number
}

// Cosmetic preferences must never prevent access to the game or saved data.
export function getPreference(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
export function setPreference(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}
export const getStoredIsHighContrastMode = () =>
  getPreference('highContrast') === '1'
export const setStoredIsHighContrastMode = (value: boolean) =>
  setPreference('highContrast', value ? '1' : '0')
