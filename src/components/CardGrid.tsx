import type { Card } from '../lib/cards'

export default function CardGrid({ cards, onSelect }: { cards: Card[]; onSelect: (c: Card) => void }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {cards.map((c) => (
        <button key={c.id} onClick={() => onSelect(c)} className="overflow-hidden rounded-lg bg-panel active:scale-95">
          <img src={c.thumb} alt={c.name} loading="lazy" className="aspect-[59/86] w-full object-cover" />
        </button>
      ))}
    </div>
  )
}
