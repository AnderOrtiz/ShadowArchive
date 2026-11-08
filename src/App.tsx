import { useState } from 'react'
import { CatalogProvider } from './lib/catalog'
import { AuthProvider } from './lib/auth'
import LoginGate from './components/LoginGate'
import AccountMenu from './components/AccountMenu'
import Logo from './components/Logo'
import SearchView from './components/SearchView'
import DecksView from './components/DecksView'
import CollectionView from './components/CollectionView'
import DuelView from './components/DuelView'

const TABS = [
  ['search', '🔍', 'Buscar'],
  ['decks', '🃏', 'Decks'],
  ['collection', '⭐', 'Colección'],
  ['duel', '⚔️', 'Duelo'],
] as const

export default function App() {
  const [tab, setTab] = useState<string>('search')
  return (
    <CatalogProvider>
      <AuthProvider onRequestLogin={() => setTab('decks')}>
        <div className="flex h-full flex-col">
          <header className="flex items-center gap-3 bg-panel px-3 pb-1.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <Logo size={32} />
            <h1 className="flex-1 font-bold tracking-wide text-accent">Shadow Archive</h1>
            <AccountMenu />
          </header>
          <nav className="grid grid-cols-4 border-b border-edge bg-panel">
            {TABS.map(([k, icon, label]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex flex-col items-center gap-0.5 border-b-2 py-2 text-xs font-medium ${tab === k ? 'border-accent text-accent' : 'border-transparent text-white/50'}`}>
                <span className="text-base leading-none">{icon}</span>{label}
              </button>
            ))}
          </nav>
          <main className="min-h-0 flex-1 overflow-y-auto">
            {tab === 'search' && <SearchView />}
            {tab === 'decks' && <LoginGate title="Mis decks"><DecksView /></LoginGate>}
            {tab === 'collection' && <LoginGate title="Colección"><CollectionView /></LoginGate>}
            {tab === 'duel' && <DuelView />}
          </main>
        </div>
      </AuthProvider>
    </CatalogProvider>
  )
}
