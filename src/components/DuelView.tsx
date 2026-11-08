import { useEffect, useState } from 'react'

const START = 8000
type Entry = { player: 0 | 1; delta: number; before: number }

export default function DuelView() {
  const [lp, setLp] = useState<[number, number]>([START, START])
  const [history, setHistory] = useState<Entry[]>([])
  const [custom, setCustom] = useState('')
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    let lock: WakeLockSentinel | undefined
    navigator.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {})
    return () => { lock?.release().catch(() => {}) }
  }, [])

  const apply = (player: 0 | 1, delta: number) => {
    setHistory((h) => [...h, { player, delta, before: lp[player] }])
    setLp((cur) => {
      const next: [number, number] = [...cur]
      next[player] = Math.max(0, cur[player] + delta)
      return next
    })
  }
  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    setHistory((h) => h.slice(0, -1))
    setLp((cur) => {
      const next: [number, number] = [...cur]
      next[last.player] = last.before
      return next
    })
  }
  const reset = () => { setLp([START, START]); setHistory([]); setResult(null) }

  const player = (p: 0 | 1) => (
    <section className={`flex flex-1 flex-col items-center justify-center gap-3 p-4 ${p === 1 ? 'rotate-180' : ''}`}>
      <div className="text-xs uppercase tracking-widest text-white/40">Jugador {p + 1}</div>
      <div className={`text-7xl font-bold tabular-nums ${lp[p] === 0 ? 'text-red-500' : 'text-gold'}`}>{lp[p]}</div>
      <div className="flex flex-wrap justify-center gap-2">
        {[-100, -500, -1000].map((d) => (
          <button key={d} onClick={() => apply(p, d)} className="rounded-lg bg-red-500/20 px-3 py-2 text-red-300 active:scale-95">{d}</button>
        ))}
        {[500, 1000].map((d) => (
          <button key={d} onClick={() => apply(p, d)} className="rounded-lg bg-emerald-500/20 px-3 py-2 text-emerald-300 active:scale-95">+{d}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))}
          placeholder="Monto" className="w-24 rounded-lg border border-edge bg-panel px-2 py-2 text-center"
        />
        <button onClick={() => { const n = Number(custom); if (n) { apply(p, -n); setCustom('') } }} className="rounded-lg bg-red-500/20 px-3 text-red-300">Restar</button>
        <button onClick={() => { const n = Number(custom); if (n) { apply(p, n); setCustom('') } }} className="rounded-lg bg-emerald-500/20 px-3 text-emerald-300">Sumar</button>
      </div>
    </section>
  )

  return (
    <div className="flex h-full flex-col">
      {player(1)}
      <div className="flex items-center justify-center gap-2 border-y border-edge bg-panel px-3 py-2 text-sm">
        <button onClick={() => setResult(Math.random() < 0.5 ? '🪙 Cara' : '🪙 Cruz')} className="rounded-lg bg-white/10 px-3 py-2">🪙 Moneda</button>
        <button onClick={() => setResult(`🎲 ${1 + Math.floor(Math.random() * 6)}`)} className="rounded-lg bg-white/10 px-3 py-2">🎲 Dado</button>
        <button onClick={undo} disabled={!history.length} className="rounded-lg bg-white/10 px-3 py-2 disabled:opacity-30">↩ Deshacer</button>
        <button onClick={reset} className="rounded-lg bg-white/10 px-3 py-2">Reiniciar</button>
        {result && <span className="ml-1 rounded-lg bg-accent/20 px-3 py-2 font-semibold text-accent">{result}</span>}
      </div>
      {player(0)}
    </div>
  )
}
