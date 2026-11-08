import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { buildIndex, loadCatalog, type Card } from '../lib/cards'
import CardModal from './CardModal'

export default function SearchView() {
  const [cards, setCards] = useState<Card[] | null>(null)
  const [status, setStatus] = useState('Cargando…')
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Card | null>(null)
  const deferred = useDeferredValue(query)

  useEffect(() => {
    loadCatalog(setStatus).then(setCards).catch((e: Error) => setError(e.message))
  }, [])

  const index = useMemo(() => (cards ? buildIndex(cards) : null), [cards])
  const results = useMemo(() => index?.search(deferred) ?? [], [index, deferred])

  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <h1 className="mb-4 text-center text-2xl font-bold tracking-wide text-accent">Shadow Archive</h1>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre o texto de la carta…"
        className="w-full rounded-xl border border-edge bg-panel px-4 py-3 text-base outline-none focus:border-accent"
      />
      {error && <p className="mt-6 text-center text-red-400">{error}</p>}
      {!cards && !error && <p className="mt-6 text-center text-white/60">{status}</p>}
      {cards && !query.trim() && (
        <p className="mt-6 text-center text-sm text-white/40">{cards.length.toLocaleString()} cartas listas. Escribe para buscar.</p>
      )}
      {cards && query.trim() && results.length === 0 && (
        <p className="mt-6 text-center text-white/50">Sin resultados.</p>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {results.map((c) => (
          <button key={c.id} onClick={() => setSelected(c)} className="overflow-hidden rounded-lg bg-panel active:scale-95">
            <img src={c.thumb} alt={c.name} loading="lazy" className="aspect-[59/86] w-full object-cover" />
          </button>
        ))}
      </div>
      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
