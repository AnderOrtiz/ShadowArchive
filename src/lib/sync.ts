import { db, runAsRemote, setOnLocalChange, tombKey, SYNCED_TABLES } from './db'
import { neon } from './neon'

type Row = Record<string, unknown>
interface Spec {
  local: (typeof SYNCED_TABLES)[number]
  remote: string
  conflict: string
  order: string
  keyOfLocal: (r: Row) => unknown
  keyOfRemote: (x: Row) => unknown
  toRemote: (r: Row) => Row
  toLocal: (x: Row) => Row
}

const SPECS: Spec[] = [
  {
    local: 'decks', remote: 'decks', conflict: 'owner_id,id', order: 'id',
    keyOfLocal: (r) => r.id, keyOfRemote: (x) => x.id,
    toRemote: (r) => ({ id: r.id, name: r.name, created_at: r.createdAt }),
    toLocal: (x) => ({ id: x.id, name: x.name, createdAt: Number(x.created_at) }),
  },
  {
    local: 'deckCards', remote: 'deck_cards', conflict: 'owner_id,deck_id,card_id,zone', order: 'card_id',
    keyOfLocal: (r) => [r.deckId, r.cardId, r.zone], keyOfRemote: (x) => [x.deck_id, x.card_id, x.zone],
    toRemote: (r) => ({ deck_id: r.deckId, card_id: r.cardId, zone: r.zone, qty: r.qty }),
    toLocal: (x) => ({ deckId: x.deck_id, cardId: x.card_id, zone: x.zone, qty: x.qty }),
  },
  {
    local: 'tags', remote: 'tags', conflict: 'owner_id,id', order: 'id',
    keyOfLocal: (r) => r.id, keyOfRemote: (x) => x.id,
    toRemote: (r) => ({ id: r.id, name: r.name, color: r.color }),
    toLocal: (x) => ({ id: x.id, name: x.name, color: x.color }),
  },
  {
    local: 'cardTags', remote: 'card_tags', conflict: 'owner_id,card_id,tag_id', order: 'card_id',
    keyOfLocal: (r) => [r.cardId, r.tagId], keyOfRemote: (x) => [x.card_id, x.tag_id],
    toRemote: (r) => ({ card_id: r.cardId, tag_id: r.tagId }),
    toLocal: (x) => ({ cardId: x.card_id, tagId: x.tag_id }),
  },
  {
    local: 'lists', remote: 'lists', conflict: 'owner_id,card_id,list', order: 'card_id',
    keyOfLocal: (r) => [r.cardId, r.list], keyOfRemote: (x) => [x.card_id, x.list],
    toRemote: (r) => ({ card_id: r.cardId, list: r.list }),
    toLocal: (x) => ({ cardId: x.card_id, list: x.list }),
  },
  {
    local: 'notes', remote: 'card_notes', conflict: 'owner_id,card_id', order: 'card_id',
    keyOfLocal: (r) => r.cardId, keyOfRemote: (x) => x.card_id,
    toRemote: (r) => ({ card_id: r.cardId, content: r.text }),
    toLocal: (x) => ({ cardId: x.card_id, text: x.content }),
  },
]

// Margen para tolerar relojes desfasados entre dispositivos (la comparación LWW hace idempotente el reproceso).
const PULL_MARGIN_MS = 5 * 60 * 1000
const PAGE = 1000
const pullMargin = (since: number) => (since > 0 ? PULL_MARGIN_MS : 0)
const BATCH = 200

const getMeta = async <T>(key: string, fallback: T): Promise<T> => ((await db.meta.get(key))?.value as T) ?? fallback
const setMeta = (key: string, value: unknown) => db.meta.put({ key, value })

async function pull(spec: Spec, since: number): Promise<number> {
  if (!neon) return since
  const table = db.table(spec.local)
  let maxTs = since
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await neon.from(spec.remote).select('*')
      .gt('updated_at', Math.max(0, since - pullMargin(since))).order('updated_at', { ascending: true }).order(spec.order, { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`${spec.remote}: ${error.message}`)
    const rows = (data ?? []) as Row[]
    for (const x of rows) {
      const ts = Number(x.updated_at)
      maxTs = Math.max(maxTs, ts)
      const key = spec.keyOfRemote(x)
      const local = await table.get(key as never)
      const tomb = await db.tombstones.get([spec.local, tombKey(key)])
      const localTs = Math.max((local?.updatedAt as number | undefined) ?? 0, tomb?.ts ?? 0)
      if (ts <= localTs) continue // gana lo local (last-write-wins)
      await runAsRemote(async () => {
        if (x.deleted) { if (local) await table.delete(key as never) }
        else await table.put({ ...spec.toLocal(x), updatedAt: ts })
        if (tomb) await db.tombstones.delete([spec.local, tombKey(key)])
      })
    }
    if (rows.length < PAGE) break
  }
  return maxTs
}

async function push(spec: Spec, uid: string, lastPush: number) {
  if (!neon) return
  const table = db.table(spec.local)
  const dirty = (await table.filter((r) => (r.updatedAt ?? 0) > lastPush).toArray()) as Row[]
  const out: Row[] = dirty.map((r) => ({ ...spec.toRemote(r), owner_id: uid, updated_at: r.updatedAt, deleted: false }))
  const tombs = await db.tombstones.where('t').equals(spec.local).and((t) => t.ts > lastPush).toArray()
  for (const t of tombs) out.push({ ...spec.toRemote(t.obj), owner_id: uid, updated_at: t.ts, deleted: true })
  for (let i = 0; i < out.length; i += BATCH) {
    const { error } = await neon.from(spec.remote).upsert(out.slice(i, i + BATCH), { onConflict: spec.conflict })
    if (error) throw new Error(`${spec.remote}: ${error.message}`)
  }
}

export type SyncState = { status: 'idle' | 'syncing' | 'error'; at: number | null; error: string | null }
let state: SyncState = { status: 'idle', at: null, error: null }
const listeners = new Set<(s: SyncState) => void>()
const emit = (s: SyncState) => { state = s; listeners.forEach((l) => l(s)) }
export const getSyncState = () => state
export const onSyncState = (l: (s: SyncState) => void) => { listeners.add(l); return () => { listeners.delete(l) } }

let running: Promise<void> | null = null
let rerun = false
let currentUid: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined

export function setSyncUser(uid: string | null) { currentUid = uid }

export async function syncNow(): Promise<void> {
  if (!neon || !currentUid) return
  if (running) { rerun = true; return running }
  const uid = currentUid
  running = (async () => {
    emit({ ...state, status: 'syncing', error: null })
    try {
      const started = Date.now()
      const lastPull = await getMeta<number>(`pull:${uid}`, 0)
      const lastPush = await getMeta<number>(`push:${uid}`, 0)
      let maxPull = lastPull
      for (const s of SPECS) maxPull = Math.max(maxPull, await pull(s, lastPull))
      for (const s of SPECS) await push(s, uid, lastPush)
      await setMeta(`pull:${uid}`, maxPull)
      await setMeta(`push:${uid}`, started)
      emit({ status: 'idle', at: Date.now(), error: null })
    } catch (e) {
      emit({ status: 'error', at: state.at, error: (e as Error).message })
    }
  })().finally(() => {
    running = null
    if (rerun) { rerun = false; void syncNow() }
  })
  return running
}

// Sincroniza poco después de cada cambio local.
setOnLocalChange(() => {
  if (!currentUid) return
  clearTimeout(timer)
  timer = setTimeout(() => void syncNow(), 1500)
})

/** Borra los datos del usuario del dispositivo (al cerrar sesión). */
export async function wipeLocalUserData() {
  await db.transaction('rw', [db.decks, db.deckCards, db.tags, db.cardTags, db.lists, db.notes, db.tombstones, db.meta], async () => {
    await runAsRemote(async () => {
      for (const n of SYNCED_TABLES) await db.table(n).clear()
    })
    await db.tombstones.clear()
    // No borramos 'catalogVersion': evita volver a descargar el catálogo al cerrar sesión.
    await db.meta.filter((m) => /^(pull|push):/.test(m.key)).delete()
  })
}

export const hasUnsyncedChanges = async (uid: string) => {
  const lastPush = await getMeta<number>(`push:${uid}`, 0)
  for (const s of SPECS) {
    if ((await db.table(s.local).filter((r) => (r.updatedAt ?? 0) > lastPush).count()) > 0) return true
  }
  return (await db.tombstones.filter((t) => t.ts > lastPush).count()) > 0
}
