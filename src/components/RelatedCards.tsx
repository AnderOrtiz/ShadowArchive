import { useMemo } from 'react'
import { useCatalog } from '../lib/catalog'
import type { Card } from '../lib/cards'
import { findRelated } from '../lib/related'

export default function RelatedCards({ card, onSelect }: { card: Card; onSelect: (c: Card) => void }) {
  const { all, byName } = useCatalog()
  const rel = useMemo(() => findRelated(card, all, byName), [card, all, byName])
  const sections: [string, Card[]][] = [
    ['Citadas en su texto', rel.mentioned],
    ['Que citan a esta carta', rel.mentionedBy],
    [card.archetype ? `Arquetipo ${card.archetype}` : 'Arquetipo', rel.archetype],
  ]
  const empty = sections.every(([, l]) => l.length === 0)

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <img src={card.thumb} alt={card.name} className="w-16 rounded-lg" />
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-white/40">Cartas relacionadas con</div>
          <h2 className="text-lg font-bold">{card.name}</h2>
        </div>
      </div>
      {empty && <p className="text-sm text-white/50">No encontré cartas relacionadas. Las relaciones salen de los nombres que aparecen entre comillas en el texto y del arquetipo.</p>}
      {sections.map(([title, list]) => list.length > 0 && (
        <section key={title} className="mb-4">
          <h3 className="mb-2 text-xs uppercase tracking-widest text-white/40">{title} ({list.length})</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {list.map((c) => (
              <button key={c.id} onClick={() => onSelect(c)} className="overflow-hidden rounded bg-void active:scale-95">
                <img src={c.thumb} alt={c.name} loading="lazy" className="aspect-[59/86] w-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
