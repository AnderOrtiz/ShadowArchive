// Cache-first para imágenes de cartas: tras la primera carga funcionan sin conexión.
const IMG_CACHE = 'shadow-archive-images-v1'
// YGOPRODeck no envía CORS, así que las respuestas son opaque y Chrome les cuenta ~7 MB de cuota cada una.
// Limitamos la cantidad para no agotar la cuota del navegador.
const MAX_ENTRIES = 300

async function trim(cache) {
  const keys = await cache.keys()
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) await cache.delete(k)
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.hostname !== 'images.ygoprodeck.com') return
  event.respondWith(
    caches.open(IMG_CACHE).then(async (cache) => {
      const hit = await cache.match(req)
      if (hit) return hit
      const res = await fetch(req)
      // Las respuestas "opaque" (cross-origin sin CORS) también se pueden guardar.
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone()).then(() => trim(cache))
      return res
    }),
  )
})
