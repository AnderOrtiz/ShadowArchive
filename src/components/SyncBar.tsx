import { useAuth } from '../lib/auth'

export default function SyncBar() {
  const { user, sync, syncNow, signOut } = useAuth()
  if (!user) return null
  const label = sync.status === 'syncing' ? '⟳ Sincronizando…'
    : sync.status === 'error' ? '⚠️ Error al sincronizar'
    : sync.at ? `✓ Sincronizado ${new Date(sync.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Sin sincronizar'
  return (
    <div className="flex items-center justify-between gap-2 border-b border-edge bg-panel px-3 py-1.5 text-xs text-white/50">
      <button onClick={() => void syncNow()} title={sync.error ?? undefined} className={sync.status === 'error' ? 'text-red-300' : ''}>{label}</button>
      <span className="min-w-0 truncate">{user.email} · <button onClick={() => void signOut()} className="text-accent">Salir</button></span>
    </div>
  )
}
