import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Card } from '../lib/cards'
import { useAuth } from '../lib/auth'
import RelatedCards from './RelatedCards'
import { addToDeck, createDeck, createTag, db, setNote, toggleCardTag, toggleList } from '../lib/db'

const BAN_LABEL: Record<string, string> = { Banned: '🚫 Prohibida (TCG)', Limited: 'Limitada a 1 (TCG)', 'Semi-Limited': 'Semi-limitada a 2 (TCG)' }

type View = 'card' | 'decks' | 'tags' | 'related'

export default function CardModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const { user, requestLogin } = useAuth()
  const [menu, setMenu] = useState(false)
  const [more, setMore] = useState(false)
  const [view, setView] = useState<View>('card')
  const [newName, setNewName] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [openRelated, setOpenRelated] = useState<Card | null>(null)

  const decks = useLiveQuery(() => db.decks.toArray().then((d) => d.sort((a, b) => b.createdAt - a.createdAt)), [])
  const tags = useLiveQuery(() => db.tags.toArray(), [])
  const myTags = useLiveQuery(() => db.cardTags.where('cardId').equals(card.id).toArray(), [card.id])
  const myLists = useLiveQuery(() => db.lists.where('cardId').equals(card.id).toArray(), [card.id])
  const note = useLiveQuery(() => db.notes.get(card.id), [card.id])
  const isFav = !!myLists?.some((l) => l.list === 'favorite')
  const isWish = !!myLists?.some((l) => l.list === 'wishlist')

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 1800) }
  const item = 'flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/10'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[92%] w-full max-w-md overflow-y-auto rounded-t-2xl border border-edge bg-panel p-4 sm:rounded-2xl"
        onClick={(e) => { e.stopPropagation(); setMenu(false) }}
      >
        {view === 'card' && (
          <>
            <div className="mb-3 flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold">{card.name}</h2>
              <div className="relative flex shrink-0 items-center">
                <button
                  aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  aria-pressed={isFav}
                  onClick={(e) => { e.stopPropagation(); if (user) void toggleList(card.id, 'favorite'); else { onClose(); requestLogin() } }}
                  className={`rounded-lg px-2 py-1 transition active:scale-90 hover:bg-white/10 ${isFav ? 'text-gold' : 'text-white/40'}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.5l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3.5Z" />
                  </svg>
                </button>
                <button aria-label="Menú" onClick={(e) => { e.stopPropagation(); setMenu((m) => !m) }} className="rounded-lg px-3 py-1 text-xl hover:bg-white/10">⋮</button>
                {menu && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-60 overflow-hidden rounded-xl border border-edge bg-void text-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
                    {!user && (
                      <button className={`${item} text-accent`} onClick={() => { onClose(); requestLogin() }}>🔒 Inicia sesión para guardar</button>
                    )}
                    {user && <>
                    <button className={item} onClick={() => { setView('decks'); setMenu(false) }}>Agregar / crear deck</button>
                    <button className={item} onClick={() => { toggleList(card.id, 'wishlist'); setMenu(false) }}>{isWish ? '🎯 Quitar de deseos' : '🎯 Lista de deseos'}</button>
                    <button className={item} onClick={() => { setView('tags'); setMenu(false) }}>🏷️ Tags</button>
                    </>}
                    <button className={item} onClick={() => { setMore(true); setMenu(false) }}>Ver más</button>
                  </div>
                )}
              </div>
            </div>
            <div className="mb-2 flex flex-wrap gap-1 text-xs">
              {card.ban && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-300">{BAN_LABEL[card.ban] ?? card.ban}</span>}
              {isFav && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-gold">★ Favorita</span>}
              {isWish && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent">🎯 Deseo</span>}
              {myTags?.map((ct) => {
                const t = tags?.find((x) => x.id === ct.tagId)
                return t && <span key={t.id} className="rounded-full px-2 py-0.5 text-void" style={{ background: t.color }}>{t.name}</span>
              })}
            </div>
            <img src={card.img} alt={card.name} className="mx-auto mb-3 w-3/4 rounded-lg" />
            <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">{card.desc}</p>
            {user && (
              <div className="mt-4">
                <label className="mb-1 block text-xs text-white/40">Notas (Markdown)</label>
                <textarea key={note === undefined ? 'cargando' : 'listo'} defaultValue={note?.text ?? ''} rows={3}
                  onBlur={(e) => { if (e.target.value !== (note?.text ?? '')) void setNote(card.id, e.target.value) }}
                  placeholder="Combos, trucos, con qué juega bien…"
                  className="w-full rounded-lg border border-edge bg-void px-3 py-2 text-sm outline-none focus:border-accent" />
              </div>
            )}
            {more && (
              <dl className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-void p-3 text-sm">
                {([
                  ['Tipo', card.type], ['Raza', card.race], ['Atributo', card.attribute],
                  ['Arquetipo', card.archetype], ['Nivel', card.level], ['ATK', card.atk], ['DEF', card.def],
                  ['Precio (TCGplayer)', card.price !== undefined ? `$${card.price.toFixed(2)} USD` : undefined],
                ] as const).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-white/40">{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            )}
          </>
        )}

        {view === 'decks' && (
          <>
            <h2 className="mb-3 text-lg font-bold">Agregar “{card.name}”</h2>
            <div className="mb-3 flex gap-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del nuevo deck"
                className="min-w-0 flex-1 rounded-lg border border-edge bg-void px-3 py-2 outline-none focus:border-accent" />
              <button onClick={async () => { await createDeck(newName, card); setNewName(''); flash('Deck creado'); setView('card') }}
                className="rounded-lg bg-accent/20 px-3 text-accent">Crear</button>
            </div>
            {decks?.length === 0 && <p className="text-sm text-white/40">Aún no tienes decks.</p>}
            <div className="overflow-hidden rounded-xl border border-edge">
              {decks?.map((d) => (
                <button key={d.id} className={`${item} border-b border-edge last:border-0`}
                  onClick={async () => { await addToDeck(d.id, card); flash(`Agregada a ${d.name}`); setView('card') }}>
                  {d.name}<span className="text-white/40">+</span>
                </button>
              ))}
            </div>
          </>
        )}

        {view === 'tags' && (
          <>
            <h2 className="mb-3 text-lg font-bold">Tags de “{card.name}”</h2>
            <div className="mb-3 flex gap-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nuevo tag"
                className="min-w-0 flex-1 rounded-lg border border-edge bg-void px-3 py-2 outline-none focus:border-accent" />
              <button onClick={async () => { const id = await createTag(newName); if (id) { const on = myTags?.some((c) => c.tagId === id); if (!on) await toggleCardTag(card.id, id) } setNewName('') }}
                className="rounded-lg bg-accent/20 px-3 text-accent">Crear</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags?.map((t) => {
                const on = myTags?.some((c) => c.tagId === t.id)
                return (
                  <button key={t.id} onClick={() => toggleCardTag(card.id, t.id)}
                    className="rounded-full border px-3 py-1 text-sm"
                    style={on ? { background: t.color, color: '#0e0720', borderColor: t.color } : { borderColor: t.color, color: t.color }}>
                    {t.name}
                  </button>
                )
              })}
              {tags?.length === 0 && <p className="text-sm text-white/40">Crea tu primer tag arriba.</p>}
            </div>
          </>
        )}

        {view === 'related' && <RelatedCards card={card} onSelect={setOpenRelated} />}

        {toast && <p className="mt-3 rounded-lg bg-emerald-500/20 py-2 text-center text-sm text-emerald-300">{toast}</p>}
        {view === 'card' && (
          <button onClick={() => setView('related')} className="mt-4 w-full rounded-xl border border-accent/60 py-3 font-medium text-accent hover:bg-accent/10">
            Cartas relacionadas
          </button>
        )}
        <button onClick={view === 'card' ? onClose : () => { setView('card'); setNewName('') }}
          className="mt-4 w-full rounded-xl bg-accent/20 py-3 font-medium text-accent">
          {view === 'card' ? 'Cerrar' : 'Volver'}
        </button>
      </div>
      {openRelated && (
        // Evita que un clic en el fondo de la carta relacionada cierre también la carta de abajo.
        <div onClick={(e) => e.stopPropagation()}>
          <CardModal card={openRelated} onClose={() => setOpenRelated(null)} />
        </div>
      )}
    </div>
  )
}
