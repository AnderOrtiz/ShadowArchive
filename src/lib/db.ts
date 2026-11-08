import Dexie from 'dexie'
import type { Card } from './cards'

export type Zone = 'main' | 'extra' | 'side'
export type ListName = 'favorite' | 'wishlist'

export interface Deck { id: string; name: string; createdAt: number }
export interface DeckCard { deckId: string; cardId: number; zone: Zone; qty: number }
export interface Tag { id: string; name: string; color: string }
export interface CardTag { cardId: number; tagId: string }
export interface ListEntry { cardId: number; list: ListName }

export const db = new Dexie('shadow-archive') as Dexie & {
  cards: Dexie.Table<Card, number>
  decks: Dexie.Table<Deck, string>
  deckCards: Dexie.Table<DeckCard, [string, number, Zone]>
  tags: Dexie.Table<Tag, string>
  cardTags: Dexie.Table<CardTag, [number, string]>
  lists: Dexie.Table<ListEntry, [number, ListName]>
}

db.version(1).stores({ cards: 'id' })
db.version(2).stores({
  cards: 'id',
  decks: 'id',
  deckCards: '[deckId+cardId+zone],deckId',
  tags: 'id',
  cardTags: '[cardId+tagId],cardId,tagId',
  lists: '[cardId+list],list',
})

export const TAG_COLORS = ['#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#fb923c']

const EXTRA_TYPES = ['Fusion', 'Synchro', 'XYZ', 'Link']
export const zoneFor = (card: Card): Zone => (EXTRA_TYPES.some((t) => card.type.includes(t)) ? 'extra' : 'main')

export async function createDeck(name: string, card?: Card): Promise<string> {
  const id = crypto.randomUUID()
  await db.decks.add({ id, name: name.trim() || 'Deck sin nombre', createdAt: Date.now() })
  if (card) await addToDeck(id, card)
  return id
}

export async function addToDeck(deckId: string, card: Card, zone: Zone = zoneFor(card)) {
  const key: [string, number, Zone] = [deckId, card.id, zone]
  const existing = await db.deckCards.get(key)
  if (existing) await db.deckCards.update(key, { qty: existing.qty + 1 })
  else await db.deckCards.add({ deckId, cardId: card.id, zone, qty: 1 })
}

export async function changeQty(dc: DeckCard, delta: number) {
  const key: [string, number, Zone] = [dc.deckId, dc.cardId, dc.zone]
  const qty = dc.qty + delta
  if (qty <= 0) await db.deckCards.delete(key)
  else await db.deckCards.update(key, { qty })
}

export async function moveToSide(dc: DeckCard) {
  const to: Zone = dc.zone === 'side' ? 'main' : 'side'
  await db.transaction('rw', db.deckCards, async () => {
    await db.deckCards.delete([dc.deckId, dc.cardId, dc.zone])
    const key: [string, number, Zone] = [dc.deckId, dc.cardId, to]
    const ex = await db.deckCards.get(key)
    if (ex) await db.deckCards.update(key, { qty: ex.qty + dc.qty })
    else await db.deckCards.add({ ...dc, zone: to })
  })
}

export async function deleteDeck(id: string) {
  await db.transaction('rw', db.decks, db.deckCards, async () => {
    await db.deckCards.where('deckId').equals(id).delete()
    await db.decks.delete(id)
  })
}

export async function toggleList(cardId: number, list: ListName) {
  const key: [number, ListName] = [cardId, list]
  if (await db.lists.get(key)) await db.lists.delete(key)
  else await db.lists.add({ cardId, list })
}

export async function toggleCardTag(cardId: number, tagId: string) {
  const key: [number, string] = [cardId, tagId]
  if (await db.cardTags.get(key)) await db.cardTags.delete(key)
  else await db.cardTags.add({ cardId, tagId })
}

export async function createTag(name: string): Promise<string | null> {
  const clean = name.trim()
  if (!clean) return null
  const existing = await db.tags.filter((t) => t.name.toLowerCase() === clean.toLowerCase()).first()
  if (existing) return existing.id
  const id = crypto.randomUUID()
  const count = await db.tags.count()
  await db.tags.add({ id, name: clean, color: TAG_COLORS[count % TAG_COLORS.length] })
  return id
}

export async function deleteTag(id: string) {
  await db.transaction('rw', db.tags, db.cardTags, async () => {
    await db.cardTags.where('tagId').equals(id).delete()
    await db.tags.delete(id)
  })
}
