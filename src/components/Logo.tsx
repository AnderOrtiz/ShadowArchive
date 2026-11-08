/** Puzzle del Milenio: anillo, pirámide invertida dorada y Ojo de Wdjat. */
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Shadow Archive">
      <defs>
        <linearGradient id="puzzle-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#c98a0a" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="9" r="5" fill="none" stroke="url(#puzzle-gold)" strokeWidth="3" />
      <path d="M12 15H52L32 60Z" fill="url(#puzzle-gold)" stroke="#7a4f00" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M21 29Q32 20 43 29Q32 38 21 29Z" fill="#2b0f4c" />
      <circle cx="32" cy="29" r="4.2" fill="#f5b301" />
      <circle cx="32" cy="29" r="1.8" fill="#2b0f4c" />
      <path d="M32 37V42" stroke="#2b0f4c" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
