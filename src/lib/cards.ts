import { db } from './db'
import MiniSearch from 'minisearch'

export interface Card {
  id: number
  name: string
  desc: string
  type: string
  race?: string
  attribute?: string
  archetype?: string
  atk?: number
  def?: number
  level?: number
  img: string
  thumb: string
}

const API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'

interface ApiCard {
  id: number; name: string; desc: string; type: string
  race?: string; attribute?: string; archetype?: string
  atk?: number; def?: number; level?: number
  card_images: { image_url: string; image_url_small: string }[]
}

export async function loadCatalog(onStatus: (s: string) => void): Promise<Card[]> {
  const cached = await db.cards.toArray()
  if (cached.length > 0) return cached
  onStatus('Descargando catálogo (solo la primera vez)…')
  const res = await fetch(API)
  if (!res.ok) throw new Error(`No se pudo descargar el catálogo (${res.status})`)
  const json = (await res.json()) as { data: ApiCard[] }
  const cards: Card[] = json.data.map((c) => ({
    id: c.id, name: c.name, desc: c.desc, type: c.type,
    race: c.race, attribute: c.attribute, archetype: c.archetype,
    atk: c.atk, def: c.def, level: c.level,
    img: c.card_images[0].image_url,
    thumb: c.card_images[0].image_url_small,
  }))
  await db.cards.bulkPut(cards)
  return cards
}

export function buildIndex(cards: Card[]) {
  const ms = new MiniSearch<Card>({
    fields: ['name', 'desc', 'archetype'],
    storeFields: [],
    searchOptions: { boost: { name: 3, archetype: 2 }, prefix: true, fuzzy: 0.2, combineWith: 'AND' },
  })
  ms.addAll(cards)
  const byId = new Map(cards.map((c) => [c.id, c]))
  return {
    search(q: string, limit = 120): Card[] {
      const query = q.trim()
      if (!query) return []
      return ms.search(query).slice(0, limit).map((r) => byId.get(r.id)!)
    },
  }
}
