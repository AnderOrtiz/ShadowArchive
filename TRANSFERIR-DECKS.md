# Transferir decks con Master Duel y Neuron

Shadow Archive no se conecta directo con Master Duel ni Neuron. El puente es la **base de datos oficial de Konami** más una extensión de navegador de la comunidad, [Deck transfer for Master Duel and Neuron](https://github.com/DawnbrandBots/deck-transfer-for-master-duel). Esta guía también está dentro de Shadow Archive: **Decks → “¿Cómo paso decks a Master Duel o Neuron?”**.

Formatos que usa la app:

| Formato | Qué es | Dónde |
|---|---|---|
| **YDKE** | Un enlace de texto (`ydke://…`) con las tres zonas del deck | Botón **Copiar YDKE** dentro de un deck; caja **Importar enlace YDKE** en la lista de decks |
| **.ydk** | Un archivo de texto con un código de carta por línea | Botón **⬇ .ydk** dentro de un deck; **Importar archivo .ydk** en la lista de decks |

## Requisitos

1. Instala la extensión en Chrome, Edge, Firefox o Safari de escritorio. En Android solo funciona con Firefox.
2. Vincula tu cuenta de Master Duel o Neuron a un ID de Konami (en Master Duel: menú → **Data Transfer**). Ese ID necesita un Card Game ID.

## De Shadow Archive al juego

1. Abre el deck y toca **Copiar YDKE** (o **⬇ .ydk**).
2. Entra a la [base de datos oficial de Konami](https://www.db.yugioh-card.com/yugiohdb/?request_locale=en), abre **My Deck** y el editor de un deck.
3. Con los botones que añade la extensión usa **Import YDKE from clipboard** y guarda.
4. En el juego, copia ese deck de tu cuenta oficial a tus decks.

## Del juego a Shadow Archive

1. En Master Duel o Neuron, exporta el deck a tu cuenta oficial desde la pantalla del deck.
2. En la base de datos oficial, abre el deck en **My Deck**.
3. Con los botones de la extensión, copia el enlace YDKE o descarga el `.ydk`.
4. En **Decks**, pega el enlace en “Importar enlace YDKE” o elige el archivo en “Importar archivo .ydk”.

## Ten en cuenta

- Si faltan cartas muy nuevas o exclusivas de una región, cambia el idioma de la base de datos de Konami (por ejemplo a japonés) y vuelve a exportar.
- Al importar, la app te avisa de los códigos que no encuentra en su catálogo.
- La extensión es de la comunidad, no de Konami, y puede dejar de funcionar si Konami cambia su sitio.
- Duel Links no tiene exportación oficial.
