import { useState } from 'react'
import { CatalogProvider } from './lib/catalog'
import SearchView from './components/SearchView'
import DecksView from './components/DecksView'
import CollectionView from './components/CollectionView'
import DuelView from './components/DuelView'

const TABS = [
  ['search', '🔍 Buscar'],
  ['decks', '🃏 Decks'],
  ['collection', '⭐ Colección'],
  ['duel', '⚔️ Duelo'],
] as const
type Tab = (typeof TABS)[number][0]

export default function App() {
  const [tab, setTab] = useState<Tab>('search')
  return (
    <CatalogProvider>
      <div className="flex h-full flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto">
          {tab === 'search' && <SearchView />}
          {tab === 'decks' && <DecksView />}
          {tab === 'collection' && <CollectionView />}
          {tab === 'duel' && <DuelView />}
        </main>
        <nav className="grid grid-cols-4 border-t border-edge bg-panel pb-[env(safe-area-inset-bottom)]">
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`py-3 text-xs font-medium ${tab === k ? 'text-accent' : 'text-white/50'}`}>
              {label}
            </button>
          ))}
        </nav>
      </div>
    </CatalogProvider>
  )
}
