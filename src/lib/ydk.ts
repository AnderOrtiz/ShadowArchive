import { db, createDeck, type DeckCard, type Zone } from './db'

/** Formato .ydk (EDOPro, YGOPro, Master Duel vía conversores): un id por línea, repetido por copia. */
export function toYdk(rows: DeckCard[]): string {
  const section = (z: Zone) => rows.filter((r) => r.zone === z).flatMap((r) => Array<string>(r.qty).fill(String(r.cardId)))
  return ['#created by Shadow Archive', '#main', ...section('main'), '#extra', ...section('extra'), '!side', ...section('side'), ''].join('\n')
}

export function parseYdk(text: string): Record<Zone, number[]> {
  const out: Record<Zone, number[]> = { main: [], extra: [], side: [] }
  let zone: Zone = 'main'
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (line === '#main') zone = 'main'
    else if (line === '#extra') zone = 'extra'
    else if (line === '!side') zone = 'side'
    else if (/^\d+$/.test(line)) out[zone].push(Number(line))
  }
  return out
}

/** Crea un deck desde un .ydk. Devuelve su id y los ids que no existen en el catálogo. */
export async function importYdk(name: string, text: string, known: Set<number>) {
  const parsed = parseYdk(text)
  const counts = new Map<string, DeckCard>()
  const unknown = new Set<number>()
  const id = await createDeck(name)
  for (const zone of ['main', 'extra', 'side'] as const) {
    for (const cardId of parsed[zone]) {
      if (!known.has(cardId)) { unknown.add(cardId); continue }
      const k = `${zone}:${cardId}`
      const cur = counts.get(k)
      if (cur) cur.qty++
      else counts.set(k, { deckId: id, cardId, zone, qty: 1 })
    }
  }
  await db.deckCards.bulkPut([...counts.values()])
  return { id, unknown: [...unknown], total: parsed.main.length + parsed.extra.length + parsed.side.length }
}
