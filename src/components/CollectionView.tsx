import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCatalog } from '../lib/catalog'
import type { Card } from '../lib/cards'
import { createTag, db, deleteTag } from '../lib/db'
import CardGrid from './CardGrid'
import CardModal from './CardModal'

type Sub = 'favorite' | 'wishlist' | 'tags'

export default function CollectionView() {
  const catalog = useCatalog()
  const [sub, setSub] = useState<Sub>('favorite')
  const [tagId, setTagId] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')
  const [selected, setSelected] = useState<Card | null>(null)

  const favs = useLiveQuery(() => db.lists.where('list').equals('favorite').toArray(), [])
  const wishes = useLiveQuery(() => db.lists.where('list').equals('wishlist').toArray(), [])
  const tags = useLiveQuery(() => db.tags.toArray(), [])
  const tagLinks = useLiveQuery(() => db.cardTags.toArray(), [])

  const toCards = (ids: number[] = []) => ids.map((i) => catalog.byId.get(i)).filter((c): c is Card => !!c)
  const tabs: [Sub, string][] = [['favorite', '★ Favoritos'], ['wishlist', '🎯 Deseos'], ['tags', '🏷️ Tags']]

  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <h1 className="mb-4 text-center text-2xl font-bold text-accent">Colección</h1>
      <div className="mb-2 grid grid-cols-3 gap-2">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => { setSub(k); setTagId(null) }}
            className={`rounded-lg py-2 text-sm ${sub === k ? 'bg-accent/20 text-accent' : 'bg-panel text-white/50'}`}>{l}</button>
        ))}
      </div>

      {sub === 'favorite' && (favs?.length ? <CardGrid cards={toCards(favs.map((f) => f.cardId))} onSelect={setSelected} /> : <Empty text="Sin favoritos todavía." />)}
      {sub === 'wishlist' && (wishes?.length ? <CardGrid cards={toCards(wishes.map((f) => f.cardId))} onSelect={setSelected} /> : <Empty text="Tu lista de deseos está vacía." />)}

      {sub === 'tags' && (
        <>
          <form className="mt-3 flex gap-2" onSubmit={async (e) => { e.preventDefault(); await createTag(newTag); setNewTag('') }}>
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Nuevo tag"
              className="min-w-0 flex-1 rounded-xl border border-edge bg-panel px-4 py-2 outline-none focus:border-accent" />
            <button className="rounded-xl bg-accent/20 px-4 text-accent">Crear</button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags?.map((t) => {
              const n = tagLinks?.filter((l) => l.tagId === t.id).length ?? 0
              const on = tagId === t.id
              return (
                <span key={t.id} className="inline-flex items-center overflow-hidden rounded-full border text-sm"
                  style={{ borderColor: t.color, background: on ? t.color : 'transparent', color: on ? '#0b0714' : t.color }}>
                  <button className="px-3 py-1" onClick={() => setTagId(on ? null : t.id)}>{t.name} · {n}</button>
                  <button className="px-2 py-1 opacity-60" aria-label={`Eliminar ${t.name}`}
                    onClick={() => { if (confirm(`¿Eliminar el tag “${t.name}”?`)) { deleteTag(t.id); if (on) setTagId(null) } }}>×</button>
                </span>
              )
            })}
          </div>
          {tags?.length === 0 && <Empty text="Crea tags aquí o desde el menú ⋮ de una carta." />}
          {tagId && <CardGrid cards={toCards(tagLinks?.filter((l) => l.tagId === tagId).map((l) => l.cardId))} onSelect={setSelected} />}
        </>
      )}
      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

const Empty = ({ text }: { text: string }) => <p className="mt-6 text-center text-sm text-white/40">{text}</p>
