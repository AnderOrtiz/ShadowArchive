import type { DeckCard, Zone } from './db'

/**
 * Formato YDKE: ydke://<main>!<extra>!<side>!
 * Cada zona es una lista de códigos de carta (uint32 little-endian) en base64.
 * Es el mismo que usa la extensión "Deck transfer for Master Duel and Neuron".
 */
const toBase64 = (ids: number[]): string => {
  const bytes = new Uint8Array(new Uint32Array(ids).buffer)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

const fromBase64 = (b64: string): number[] => {
  if (!b64) return []
  const bin = atob(b64)
  if (bin.length % 4 !== 0) throw new Error('Enlace YDKE dañado: tamaño inválido.')
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return [...new Uint32Array(bytes.buffer)]
}

export function toYdke(rows: DeckCard[]): string {
  const section = (z: Zone) => rows.filter((r) => r.zone === z).flatMap((r) => Array<number>(r.qty).fill(r.cardId))
  return `ydke://${toBase64(section('main'))}!${toBase64(section('extra'))}!${toBase64(section('side'))}!`
}

export function parseYdke(text: string): Record<Zone, number[]> {
  const url = text.trim()
  if (!url.startsWith('ydke://')) throw new Error('El texto no empieza con ydke://')
  const [main = '', extra = '', side = ''] = url.slice('ydke://'.length).split('!')
  try {
    return { main: fromBase64(main), extra: fromBase64(extra), side: fromBase64(side) }
  } catch (e) {
    throw new Error(e instanceof Error && e.message.startsWith('Enlace') ? e.message : 'Enlace YDKE dañado: base64 inválido.')
  }
}
