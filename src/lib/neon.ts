import { createClient } from '@neon/neon-js'

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined
const dataUrl = import.meta.env.VITE_NEON_DATA_API_URL as string | undefined

export const neonConfigured = !!(authUrl && dataUrl)

// Si faltan las variables, la app sigue funcionando en modo local (sin login).
export const neon = neonConfigured
  ? createClient({ auth: { url: authUrl! }, dataApi: { url: dataUrl! } })
  : null
