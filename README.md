# Shadow Archive

**Demo en vivo:** https://ander-ortiz-shadow-archive.netlify.app

Segundo cerebro de Yu-Gi-Oh!: busca cartas, arma decks, guarda favoritos, deseos, tags y notas, y lleva el marcador de tus duelos. Es una app web (React + Vite) que se publica en Netlify y guarda tus datos en Neon.

## Qué puedes hacer

- **Buscar** por nombre, texto de la carta o arquetipo, con tolerancia a errores de escritura. El catálogo (~14 mil cartas de [YGOPRODeck](https://ygoprodeck.com/api-guide/)) se descarga una vez y se busca en tu dispositivo.
- **Ver una carta** completa, con ATK/DEF, nivel, atributo, arquetipo, precio de TCGplayer y estado en la banlist TCG, y sus **cartas relacionadas**.
- **Decks** con Main, Extra y Side: vista en cuadrícula (una miniatura por copia) y modo editar. Avisos de tamaño, de más de 3 copias y de banlist. Estadísticas, mano de prueba con probabilidad de abrir con tus starters, y búsqueda dentro del deck.
- **Colección:** favoritos (estrella), lista de deseos con total estimado, y tags.
- **Notas** por carta.
- **Modo duelo:** Life Points de 2 jugadores con historial y deshacer, moneda y dado.
- **Sincronización** entre dispositivos con tu cuenta. Buscar cartas y el modo duelo no necesitan iniciar sesión.

## Transferir decks con Master Duel y Neuron

Las instrucciones para pasar decks entre Shadow Archive, Master Duel y Neuron están en [TRANSFERIR-DECKS.md](TRANSFERIR-DECKS.md). También están dentro de la app: **Decks → “¿Cómo paso decks a Master Duel o Neuron?”**.

## Desarrollo

Requiere Node 20 o superior.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

### Variables de entorno

Crea un `.env.local` (no se sube a git) con las dos URLs públicas de Neon:

```
VITE_NEON_AUTH_URL=...
VITE_NEON_DATA_API_URL=...
```

Sin ellas la app funciona, pero sin inicio de sesión ni sincronización. Los `.env` y `.env.*` están en `.gitignore`: nunca subas cadenas de conexión (`DATABASE_URL`). En Netlify, configura las mismas dos variables (*Site configuration → Environment variables*) y vuelve a desplegar, porque Vite las incrusta al compilar.

## Neon

- **Esquema:** [db/schema.sql](db/schema.sql) crea las tablas con seguridad por filas (RLS): cada usuario solo ve y modifica sus datos. Se puede ejecutar de nuevo sin romper nada.
- **Caché de la Data API:** después de crear o cambiar tablas, actualízala o la API no las verá:

  ```bash
  npx neon data-api refresh-schema
  ```

- **Dominios permitidos de Auth:** cada dirección desde la que se inicia sesión debe estar registrada **sin barra final**:

  ```bash
  npx neon neon-auth domain add https://tu-sitio.netlify.app
  ```

- **Registro de cuentas:** la app incluye un botón “Crear cuenta”. Para que solo entren las personas que tú quieras, crea las cuentas y cierra el registro público:

  ```bash
  npx neon neon-auth config email-password update --disable-sign-up
  ```

- **Sincronización:** el último cambio gana (*last-write-wins*) por registro, según la hora de cada dispositivo. Los cambios se guardan primero en el dispositivo y se suben en segundo plano.

## Imágenes

Las imágenes se cargan directamente desde YGOPRODeck y un Service Worker las guarda en caché (hasta 300). YGOPRODeck pide no enlazar sus imágenes en producción: alojarlas aparte está pendiente.

## Créditos

Datos de cartas e imágenes: [YGOPRODeck](https://ygoprodeck.com). Yu-Gi-Oh! es marca de Studio Dice/SHUEISHA, TV TOKYO y KONAMI. Shadow Archive es un proyecto personal sin afiliación con ellos.
