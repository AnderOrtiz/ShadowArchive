import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { neon, neonConfigured } from './neon'
import { getSyncState, hasUnsyncedChanges, onSyncState, setSyncUser, syncNow, wipeLocalUserData, type SyncState } from './sync'

export interface User { id: string; email: string }

interface AuthCtx {
  user: User | null
  loading: boolean
  configured: boolean
  sync: SyncState
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
  requestLogin: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children, onRequestLogin }: { children: ReactNode; onRequestLogin: () => void }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(neonConfigured)
  const [sync, setSync] = useState<SyncState>(getSyncState())

  const refresh = useCallback(async () => {
    if (!neon) return
    const { data } = await neon.auth.getSession()
    const u = data?.session && data.user ? { id: data.user.id, email: data.user.email } : null
    setSyncUser(u?.id ?? null)
    setUser(u)
    setLoading(false)
    if (u) void syncNow()
  }, [])

  useEffect(() => {
    void refresh().catch(() => setLoading(false))
    const unsub = onSyncState(setSync)
    const resync = () => { if (document.visibilityState !== 'hidden') void syncNow() }
    window.addEventListener('online', resync)
    document.addEventListener('visibilitychange', resync)
    return () => { unsub(); window.removeEventListener('online', resync); document.removeEventListener('visibilitychange', resync) }
  }, [refresh])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!neon) return 'Neon no está configurado.'
    const res = await neon.auth.signIn.email({ email, password })
    if (res.error) return res.error.message ?? 'No se pudo iniciar sesión.'
    await refresh()
    return null
  }, [refresh])

  const signOut = useCallback(async () => {
    if (!neon || !user) return
    await syncNow()
    if (getSyncState().status === 'error' || (await hasUnsyncedChanges(user.id))) {
      if (!confirm('Hay cambios sin sincronizar que se perderán al cerrar sesión. ¿Cerrar sesión de todos modos?')) return
    }
    await neon.auth.signOut()
    setSyncUser(null)
    await wipeLocalUserData()
    setUser(null)
  }, [user])

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, configured: neonConfigured, sync, signIn, signOut, syncNow, requestLogin: onRequestLogin }),
    [user, loading, sync, signIn, signOut, onRequestLogin],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth fuera de AuthProvider')
  return c
}
