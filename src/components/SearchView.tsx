import { useDeferredValue, useMemo, useState } from 'react'
import { useCatalog } from '../lib/catalog'
import type { Card } from '../lib/cards'
import CardModal from './CardModal'
import CardGrid from './CardGrid'

export default function SearchView() {
  const catalog = useCatalog()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Card | null>(null)
  const deferred = useDeferredValue(query)
  const results = useMemo(() => catalog.search(deferred), [catalog, deferred])

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
      {catalog.error && <p className="mt-6 text-center text-red-400">{catalog.error}</p>}
      {!catalog.ready && !catalog.error && <p className="mt-6 text-center text-white/60">{catalog.status}</p>}
      {catalog.ready && !query.trim() && (
        <p className="mt-6 text-center text-sm text-white/40">{catalog.total.toLocaleString()} cartas listas. Escribe para buscar.</p>
      )}
      {catalog.ready && query.trim() && results.length === 0 && <p className="mt-6 text-center text-white/50">Sin resultados.</p>}
      <CardGrid cards={results} onSelect={setSelected} />
      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
