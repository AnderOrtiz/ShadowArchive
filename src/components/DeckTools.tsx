import { useMemo, useState } from 'react'
import type { Card } from '../lib/cards'
import type { DeckCard } from '../lib/db'
import { atLeastOne, deckStats, shuffled } from '../lib/stats'

const pct = (p: number) => `${(p * 100).toFixed(1)}%`

export function StatsPanel({ rows, byId }: { rows: DeckCard[]; byId: Map<number, Card> }) {
  const s = useMemo(() => deckStats(rows, byId), [rows, byId])
  const total = s.monsters + s.spells + s.traps
  if (!total) return <p className="mb-3 text-sm text-white/40">Sin cartas en el Main Deck.</p>
  const levels = Object.entries(s.levels).map(([l, n]) => [Number(l), n] as const).sort((a, b) => a[0] - b[0])
  const maxLevel = Math.max(1, ...levels.map(([, n]) => n))
  const bar = (label: string, n: number, color: string) => (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20 text-white/60">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded bg-void"><div className="h-full" style={{ width: `${(n / total) * 100}%`, background: color }} /></div>
      <span className="w-14 text-right tabular-nums">{n} · {Math.round((n / total) * 100)}%</span>
    </div>
  )
  return (
    <div className="mb-4 space-y-3 rounded-xl border border-edge bg-panel p-3">
      <div className="space-y-1">
        {bar('Monstruos', s.monsters, '#fbbf24')}
        {bar('Mágicas', s.spells, '#34d399')}
        {bar('Trampas', s.traps, '#f472b6')}
      </div>
      {levels.length > 0 && (
        <div>
          <div className="mb-1 text-xs text-white/40">Monstruos por nivel</div>
          <div className="flex h-20 items-end gap-1">
            {levels.map(([l, n]) => (
              <div key={l} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] tabular-nums text-white/60">{n}</span>
                <div className="w-full rounded-t bg-accent/70" style={{ height: `${(n / maxLevel) * 100}%`, minHeight: 2 }} />
                <span className="text-[10px] text-white/40">{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function HandSimulator({ rows, byId, onClose }: { rows: DeckCard[]; byId: Map<number, Card>; onClose: () => void }) {
  const main = useMemo(() => rows.filter((r) => r.zone === 'main'), [rows])
  const pool = useMemo(() => main.flatMap((r) => Array<number>(r.qty).fill(r.cardId)), [main])
  const [handSize, setHandSize] = useState(5)
  const [hand, setHand] = useState<number[]>(() => shuffled(pool).slice(0, 5))
  const [starters, setStarters] = useState<Set<number>>(new Set())

  const draw = (n = handSize) => setHand(shuffled(pool).slice(0, n))
  const K = main.filter((r) => starters.has(r.cardId)).reduce((a, r) => a + r.qty, 0)
  const toggle = (id: number) => setStarters((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div className="max-h-[92%] w-full max-w-md overflow-y-auto rounded-t-2xl border border-edge bg-panel p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-bold">Mano de prueba</h2>
        {pool.length < handSize ? (
          <p className="text-sm text-white/50">Necesitas al menos {handSize} cartas en el Main Deck.</p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {hand.map((id, i) => {
                const c = byId.get(id)
                return c && <img key={i} src={c.thumb} alt={c.name} className="aspect-[59/86] w-full rounded object-cover" />
              })}
            </div>
            <div className="mb-4 flex gap-2">
              <button onClick={() => draw()} className="flex-1 rounded-lg bg-accent/20 py-2 text-accent">Robar otra mano</button>
              {[5, 6].map((n) => (
                <button key={n} onClick={() => { setHandSize(n); draw(n) }} className={`rounded-lg px-3 ${handSize === n ? 'bg-accent text-void' : 'bg-white/10'}`}>{n}</button>
              ))}
            </div>
            <div className="mb-1 text-sm font-medium">¿Cuáles son tus starters?</div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {main.map((r) => {
                const c = byId.get(r.cardId)
                const on = starters.has(r.cardId)
                return c && (
                  <button key={r.cardId} onClick={() => toggle(r.cardId)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${on ? 'border-gold bg-gold text-void' : 'border-edge text-white/70'}`}>
                    {c.name} ×{r.qty}
                  </button>
                )
              })}
            </div>
            <div className="rounded-lg bg-void p-3 text-sm">
              {K === 0 ? <span className="text-white/40">Marca cartas para calcular la probabilidad.</span> : (
                <>
                  <div>{K} starters en {pool.length} cartas.</div>
                  <div className="mt-1">Abrir con al menos 1 en {handSize} cartas: <b className="text-gold">{pct(atLeastOne(pool.length, K, handSize))}</b></div>
                  <div className="text-xs text-white/40">Segundo jugador (+1 robo): {pct(atLeastOne(pool.length, K, handSize + 1))}</div>
                </>
              )}
            </div>
          </>
        )}
        <button onClick={onClose} className="mt-4 w-full rounded-xl bg-accent/20 py-3 font-medium text-accent">Cerrar</button>
      </div>
    </div>
  )
}
