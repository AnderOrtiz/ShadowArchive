import { useState } from 'react'
import SearchView from './components/SearchView'
import DuelView from './components/DuelView'

export default function App() {
  const [tab, setTab] = useState<'search' | 'duel'>('search')
  return (
    <div className="flex h-full flex-col">
      <main className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'search' ? <SearchView /> : <DuelView />}
      </main>
      <nav className="grid grid-cols-2 border-t border-edge bg-panel pb-[env(safe-area-inset-bottom)]">
        {([['search', '🔍 Buscar'], ['duel', '⚔️ Duelo']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`py-3 text-sm font-medium ${tab === k ? 'text-accent' : 'text-white/50'}`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
