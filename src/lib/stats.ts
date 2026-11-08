import type { Card } from './cards'
import type { DeckCard } from './db'

export interface DeckStats {
  monsters: number
  spells: number
  traps: number
  levels: Record<number, number>
}

/** Estadísticas del Main Deck. */
export function deckStats(rows: DeckCard[], byId: Map<number, Card>): DeckStats {
  const s: DeckStats = { monsters: 0, spells: 0, traps: 0, levels: {} }
  for (const r of rows) {
    if (r.zone !== 'main') continue
    const c = byId.get(r.cardId)
    if (!c) continue
    if (c.type.includes('Spell')) s.spells += r.qty
    else if (c.type.includes('Trap')) s.traps += r.qty
    else {
      s.monsters += r.qty
      if (c.level !== undefined) s.levels[c.level] = (s.levels[c.level] ?? 0) + r.qty
    }
  }
  return s
}

/** Probabilidad (hipergeométrica) de robar al menos 1 de las K cartas buscadas, en una mano de n, de un deck de N. */
export function atLeastOne(N: number, K: number, n: number): number {
  if (K <= 0 || N <= 0) return 0
  if (K >= N || N - K < n) return 1
  let none = 1
  for (let i = 0; i < n; i++) none *= (N - K - i) / (N - i)
  return 1 - none
}

export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
