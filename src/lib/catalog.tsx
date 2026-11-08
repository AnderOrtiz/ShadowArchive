import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildIndex, loadCatalog, type Card } from './cards'

interface Catalog {
  ready: boolean
  status: string
  error: string | null
  total: number
  byId: Map<number, Card>
  all: Card[]
  /** nombre en minúsculas → cartas con ese nombre */
  byName: Map<string, Card[]>
  search: (q: string, limit?: number) => Card[]
}

const Ctx = createContext<Catalog | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<Card[] | null>(null)
  const [status, setStatus] = useState('Cargando…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCatalog(setStatus).then(setCards).catch((e: Error) => setError(e.message))
  }, [])

  const value = useMemo<Catalog>(() => {
    const index = cards ? buildIndex(cards) : null
    const byName = new Map<string, Card[]>()
    for (const c of cards ?? []) {
      const k = c.name.toLowerCase()
      const list = byName.get(k)
      if (list) list.push(c)
      else byName.set(k, [c])
    }
    return {
      ready: !!cards, status, error,
      total: cards?.length ?? 0,
      byId: new Map((cards ?? []).map((c) => [c.id, c])),
      all: cards ?? [],
      byName,
      search: (q, limit) => index?.search(q, limit) ?? [],
    }
  }, [cards, status, error])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCatalog() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCatalog fuera de CatalogProvider')
  return c
}
