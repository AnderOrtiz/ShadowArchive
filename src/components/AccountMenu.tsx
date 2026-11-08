import { useState } from 'react'
import { useAuth } from '../lib/auth'

/** Indicador de sincronización en la cabecera; al tocarlo muestra cuenta, estado y cerrar sesión. */
export default function AccountMenu() {
  const { user, sync, syncNow, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  if (!user) return null
  const icon = sync.status === 'syncing' ? '⟳' : sync.status === 'error' ? '⚠️' : '✓'
  const label = sync.status === 'syncing' ? 'Sincronizando…'
    : sync.status === 'error' ? 'Error al sincronizar'
    : sync.at ? `Sincronizado ${new Date(sync.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Sin sincronizar'

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Cuenta y sincronización"
        className={`rounded-lg px-2 py-1 text-sm ${sync.status === 'error' ? 'text-red-300' : 'text-white/50'}`}>{icon}</button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-64 space-y-2 rounded-xl border border-edge bg-panel p-3 text-sm shadow-xl">
            <div className="truncate text-white/70">{user.email}</div>
            <button onClick={() => void syncNow()} className={sync.status === 'error' ? 'text-red-300' : 'text-white/50'}>{label} ↻</button>
            {sync.status === 'error' && sync.error && <div className="break-words text-xs text-red-300">{sync.error}</div>}
            <button onClick={() => { setOpen(false); void signOut() }} className="block text-accent">Cerrar sesión</button>
          </div>
        </>
      )}
    </div>
  )
}
