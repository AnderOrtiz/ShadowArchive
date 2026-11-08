import { useState } from 'react'
import type { Card } from '../lib/cards'

export default function CardModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const [menu, setMenu] = useState(false)
  const [more, setMore] = useState(false)

  const soon = (label: string) => (
    <button disabled className="flex w-full items-center justify-between px-4 py-3 text-left text-white/35">
      {label} <span className="text-xs">pronto</span>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[92%] w-full max-w-md overflow-y-auto rounded-t-2xl border border-edge bg-panel p-4 sm:rounded-2xl"
        onClick={(e) => { e.stopPropagation(); setMenu(false) }}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold">{card.name}</h2>
          <div className="relative">
            <button
              aria-label="Menú"
              onClick={(e) => { e.stopPropagation(); setMenu((m) => !m) }}
              className="rounded-lg px-3 py-1 text-xl hover:bg-white/10"
            >⋮</button>
            {menu && (
              <div className="absolute right-0 z-10 w-56 overflow-hidden rounded-xl border border-edge bg-void text-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
                {soon('Agregar a un deck')}
                {soon('Crear deck con esta carta')}
                {soon('⭐ Favoritos')}
                {soon('🎯 Lista de deseos')}
                <button onClick={() => { setMore(true); setMenu(false) }} className="w-full px-4 py-3 text-left hover:bg-white/10">
                  Ver más
                </button>
              </div>
            )}
          </div>
        </div>
        <img src={card.img} alt={card.name} className="mx-auto mb-3 w-3/4 rounded-lg" />
        <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">{card.desc}</p>
        {more && (
          <dl className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-void p-3 text-sm">
            {([
              ['Tipo', card.type], ['Raza', card.race], ['Atributo', card.attribute],
              ['Arquetipo', card.archetype], ['Nivel', card.level], ['ATK', card.atk], ['DEF', card.def],
            ] as const).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => (
              <div key={k}><dt className="text-xs text-white/40">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        )}
        <button onClick={onClose} className="mt-4 w-full rounded-xl bg-accent/20 py-3 font-medium text-accent">Cerrar</button>
      </div>
    </div>
  )
}
