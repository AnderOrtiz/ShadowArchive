/** Guía para pasar decks entre Shadow Archive, Master Duel y Neuron. Mantener alineada con TRANSFERIR-DECKS.md. */
export default function TransferGuide({ onClose }: { onClose: () => void }) {
  const h = 'mb-1 mt-4 text-sm font-semibold text-accent'
  const li = 'ml-4 list-decimal space-y-1 text-sm text-white/80'
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div className="max-h-[92%] w-full max-w-md overflow-y-auto rounded-t-2xl border border-edge bg-panel p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Pasar decks a Master Duel y Neuron</h2>
        <p className="mt-1 text-sm text-white/60">
          Shadow Archive no se conecta directo con Master Duel ni Neuron. El puente es la base de datos oficial de Konami y una extensión de navegador de la comunidad (<i>Deck transfer for Master Duel and Neuron</i>). Se hace desde un navegador, no desde la app del juego.
        </p>

        <h3 className={h}>Antes de empezar</h3>
        <ol className={li}>
          <li>Instala la extensión en Chrome, Edge, Firefox o Safari de escritorio. En Android solo funciona con Firefox.</li>
          <li>Vincula tu cuenta de Master Duel o Neuron a un ID de Konami (en Master Duel: menú, <b>Data Transfer</b>). Ese ID necesita un Card Game ID.</li>
        </ol>

        <h3 className={h}>De Shadow Archive al juego</h3>
        <ol className={li}>
          <li>Abre el deck y toca <b>Copiar YDKE</b> (o <b>⬇ .ydk</b> para descargar el archivo).</li>
          <li>Entra a la base de datos oficial de Konami, a <b>My Deck</b>, y abre el editor de un deck.</li>
          <li>Usa los botones que añade la extensión: <b>Import YDKE from clipboard</b> y guarda.</li>
          <li>En el juego, copia ese deck de tu cuenta oficial a tus decks.</li>
        </ol>

        <h3 className={h}>Del juego a Shadow Archive</h3>
        <ol className={li}>
          <li>En Master Duel o Neuron, exporta el deck a tu cuenta oficial desde la pantalla del deck.</li>
          <li>En la base de datos oficial, abre el deck en <b>My Deck</b>.</li>
          <li>Con los botones de la extensión, copia el enlace YDKE o descarga el <b>.ydk</b>.</li>
          <li>En <b>Decks</b>, pega el enlace en “Importar enlace YDKE” o usa “Importar archivo .ydk”.</li>
        </ol>

        <h3 className={h}>Ten en cuenta</h3>
        <ul className="ml-4 list-disc space-y-1 text-sm text-white/70">
          <li>Si faltan cartas muy nuevas o exclusivas de una región, cambia el idioma de la base de datos de Konami (por ejemplo a japonés) y vuelve a exportar.</li>
          <li>La app te avisa de los códigos que no encuentra en su catálogo al importar.</li>
          <li>La extensión es de la comunidad, no de Konami: puede dejar de funcionar si Konami cambia su sitio.</li>
          <li>No hay exportación oficial para Duel Links.</li>
        </ul>

        <button onClick={onClose} className="mt-5 w-full rounded-xl bg-accent/20 py-3 font-medium text-accent">Cerrar</button>
      </div>
    </div>
  )
}
