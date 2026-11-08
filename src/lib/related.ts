import type { Card } from './cards'

export interface Related {
  mentioned: Card[]   // cartas citadas en el texto de esta carta
  mentionedBy: Card[] // cartas que citan a esta carta
  archetype: Card[]   // mismo arquetipo
}

const LIMIT = 60

/** Nombres entre comillas dentro del texto de la carta: "Dark Magician" */
export function quotedNames(desc: string): string[] {
  const names = new Set<string>()
  for (const m of desc.matchAll(/"([^"\n]{2,80})"/g)) names.add(m[1].trim().toLowerCase())
  return [...names]
}

export function findRelated(card: Card, all: Card[], byName: Map<string, Card[]>): Related {
  const seen = new Set<number>([card.id])
  const take = (list: Card[]) => {
    const out: Card[] = []
    for (const c of list) {
      if (seen.has(c.id)) continue
      seen.add(c.id)
      out.push(c)
      if (out.length >= LIMIT) break
    }
    return out
  }

  const mentioned = take(quotedNames(card.desc).flatMap((n) => byName.get(n) ?? []))

  const needle = `"${card.name}"`
  const mentionedBy = take(all.filter((c) => c.id !== card.id && c.desc.includes(needle)))

  const archetype = card.archetype ? take(all.filter((c) => c.archetype === card.archetype)) : []
  return { mentioned, mentionedBy, archetype }
}
