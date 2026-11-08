import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCatalog } from '../lib/catalog'
import type { Card } from '../lib/cards'
import { changeQty, createDeck, db, deleteDeck, moveToSide, type DeckCard, type Zone } from '../lib/db'
import CardModal from './CardModal'

const ZONES: [Zone, string][] = [['main', 'Main Deck'], ['extra', 'Extra Deck'], ['side', 'Side Deck']]

export default function DecksView() {
  const [openId, setOpenId] = useState<string | null>(null)
  return openId ? <DeckDetail id={openId} onBack={() => setOpenId(null)} /> : <DeckList onOpen={setOpenId} />
}

function DeckList({ onOpen }: { onOpen: (id: string) => void }) {
  const [name, setName] = useState('')
  const decks = useLiveQuery(() => db.decks.orderBy('createdAt').reverse().toArray(), [])
  const counts = useLiveQuery(async () => {
    const all = await db.deckCards.toArray()
    const m = new Map<string, number>()
    for (const c of all) m.set(c.deckId, (m.get(c.deckId) ?? 0) + c.qty)
    return m
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <h1 className="mb-4 text-center text-2xl font-bold text-accent">Mis decks</h1>
      <form className="mb-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); const id = await createDeck(name); setName(''); onOpen(id) }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del nuevo deck"
          className="min-w-0 flex-1 rounded-xl border border-edge bg-panel px-4 py-3 outline-none focus:border-accent" />
        <button className="rounded-xl bg-accent/20 px-4 text-accent">Crear</button>
      </form>
      {decks?.length === 0 && <p className="text-center text-sm text-white/40">Aún no tienes decks. Crea uno aquí o desde el menú ⋮ de una carta.</p>}
      <div className="space-y-2">
        {decks?.map((d) => (
          <button key={d.id} onClick={() => onOpen(d.id)} className="flex w-full items-center justify-between rounded-xl border border-edge bg-panel px-4 py-3 text-left">
            <span className="font-medium">{d.name}</span>
            <span className="text-sm text-white/40">{counts?.get(d.id) ?? 0} cartas</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function DeckDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const catalog = useCatalog()
  const deck = useLiveQuery(() => db.decks.get(id), [id])
  const rows = useLiveQuery(() => db.deckCards.where('deckId').equals(id).toArray(), [id])
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Card | null>(null)

  const { filtered, totals, warnings } = useMemo(() => {
    const totals: Record<Zone, number> = { main: 0, extra: 0, side: 0 }
    const perCard = new Map<number, number>()
    for (const r of rows ?? []) {
      totals[r.zone] += r.qty
      perCard.set(r.cardId, (perCard.get(r.cardId) ?? 0) + r.qty)
    }
    const warnings: string[] = []
    if (totals.main < 40) warnings.push(`Main Deck tiene ${totals.main} cartas (mínimo 40).`)
    if (totals.main > 60) warnings.push(`Main Deck tiene ${totals.main} cartas (máximo 60).`)
    if (totals.extra > 15) warnings.push(`Extra Deck tiene ${totals.extra} cartas (máximo 15).`)
    if (totals.side > 15) warnings.push(`Side Deck tiene ${totals.side} cartas (máximo 15).`)
    for (const [cid, n] of perCard) if (n > 3) warnings.push(`${catalog.byId.get(cid)?.name ?? cid}: ${n} copias (máximo 3).`)

    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    const filtered = (rows ?? []).filter((r) => {
      const c = catalog.byId.get(r.cardId)
      if (!c) return false
      const text = `${c.name} ${c.desc}`.toLowerCase()
      return words.every((w) => text.includes(w))
    })
    return { filtered, totals, warnings }
  }, [rows, q, catalog])

  if (!deck) return null

  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onBack} className="rounded-lg px-2 py-1 text-white/60">← Decks</button>
        <button onClick={async () => { if (confirm(`¿Eliminar “${deck.name}”?`)) { await deleteDeck(id); onBack() } }} className="rounded-lg px-2 py-1 text-sm text-red-400">Eliminar</button>
      </div>
      <input defaultValue={deck.name} onBlur={(e) => db.decks.update(id, { name: e.target.value.trim() || deck.name })}
        className="mb-2 w-full bg-transparent text-2xl font-bold text-accent outline-none" />
      <div className="mb-3 flex gap-3 text-sm text-white/60">
        {ZONES.map(([z, l]) => <span key={z}>{l.split(' ')[0]}: <b className="text-white">{totals[z]}</b></span>)}
      </div>
      {warnings.length > 0 && (
        <ul className="mb-3 space-y-1 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {warnings.map((w) => <li key={w}>⚠️ {w}</li>)}
        </ul>
      )}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar dentro del deck (nombre o texto)…"
        className="mb-4 w-full rounded-xl border border-edge bg-panel px-4 py-3 outline-none focus:border-accent" />
      {(rows?.length ?? 0) === 0 && <p className="text-center text-sm text-white/40">Deck vacío. Agrega cartas desde la búsqueda con el menú ⋮.</p>}
      {ZONES.map(([zone, label]) => {
        const list = filtered.filter((r) => r.zone === zone)
        if (!list.length) return null
        return (
          <section key={zone} className="mb-4">
            <h3 className="mb-2 text-xs uppercase tracking-widest text-white/40">{label} ({totals[zone]})</h3>
            <div className="space-y-2">
              {list.map((r) => <Row key={`${r.cardId}-${r.zone}`} r={r} catalogCard={catalog.byId.get(r.cardId)!} onOpen={setSelected} />)}
            </div>
          </section>
        )
      })}
      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function Row({ r, catalogCard: c, onOpen }: { r: DeckCard; catalogCard: Card; onOpen: (c: Card) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-edge bg-panel p-2">
      <button onClick={() => onOpen(c)} className="w-12 shrink-0"><img src={c.thumb} alt={c.name} loading="lazy" className="aspect-[59/86] w-full rounded object-cover" /></button>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{c.name}</div>
        <button onClick={() => moveToSide(r)} className="text-xs text-white/40">{r.zone === 'side' ? '→ Mover a Main' : '→ Mover a Side'}</button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => changeQty(r, -1)} className="h-8 w-8 rounded-lg bg-white/10">−</button>
        <span className="w-5 text-center tabular-nums">{r.qty}</span>
        <button onClick={() => changeQty(r, 1)} className="h-8 w-8 rounded-lg bg-white/10">+</button>
      </div>
    </div>
  )
}
