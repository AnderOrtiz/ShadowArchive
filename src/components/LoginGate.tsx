import { useState, type ReactNode } from 'react'
import { useAuth } from '../lib/auth'

/** Muestra el contenido solo con sesión iniciada; si no, el formulario de login. */
export default function LoginGate({ children, title }: { children: ReactNode; title: string }) {
  const { user, loading, configured, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <p className="p-8 text-center text-white/50">Cargando sesión…</p>
  if (user) return <>{children}</>

  return (
    <div className="mx-auto max-w-sm px-4 pt-[max(3rem,env(safe-area-inset-top))]">
      <h1 className="mb-2 text-center text-2xl font-bold text-accent">{title}</h1>
      <p className="mb-6 text-center text-sm text-white/50">Inicia sesión para guardar y sincronizar tus decks, favoritos y tags. Buscar cartas y el modo duelo no la necesitan.</p>
      {!configured ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">Falta configurar Neon (VITE_NEON_AUTH_URL y VITE_NEON_DATA_API_URL).</p>
      ) : (
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setError(null)
          setError(await signIn(email.trim(), password)); setBusy(false)
        }}>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo"
            className="w-full rounded-xl border border-edge bg-panel px-4 py-3 outline-none focus:border-accent" />
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña"
            className="w-full rounded-xl border border-edge bg-panel px-4 py-3 outline-none focus:border-accent" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-accent/20 py-3 font-medium text-accent disabled:opacity-50">{busy ? 'Entrando…' : 'Iniciar sesión'}</button>
        </form>
      )}
    </div>
  )
}
