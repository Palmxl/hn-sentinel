# HN Sentinel

Aplicación de escritorio para monitorear Hacker News automáticamente, detectar posts que coincidan con palabras clave configuradas, y almacenarlos localmente para revisión posterior.

---

## Cómo correr el proyecto desde cero

### Prerequisitos

- Node.js v18 o superior
- npm v9 o superior
- Compatible con Linux, macOS y Windows

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd hn-sentinel

# 2. Instalar dependencias
npm install

# 3. Recompilar better-sqlite3 para Electron
./node_modules/.bin/electron-rebuild -f -w better-sqlite3

# 4. Instalar Playwright con dependencias del sistema
npx playwright install chromium --with-deps

# 5. Correr en modo desarrollo
npm run dev
```

> **Nota Linux:** Si aparece un error de sandbox en Electron, ejecuta:
> ```bash
> sudo chown root:root node_modules/electron/dist/chrome-sandbox
> sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
> ```

---

## Decisiones técnicas

### Separación del scraper en tres capas
El scraper está dividido en `hnScraper.ts` (automatización pura), `matcher.ts` (lógica de matching) y `orchestrator.ts` (coordinación). Podría haber sido un solo archivo, pero separarlo permite modificar cada parte sin tocar las otras. Si HN cambia su HTML, solo toco el scraper. Si quiero cambiar la lógica de matching, solo toco el matcher.

### better-sqlite3 síncrono en el proceso main
`better-sqlite3` es síncrono a diferencia de `sqlite3` que es async con callbacks. En el proceso main de Electron, donde toda la comunicación con el renderer ya es async via IPC, tener SQLite síncrono simplifica enormemente el código — no hay callbacks anidados ni race conditions en escrituras concurrentes.

### Zustand sobre Redux para el estado del renderer
El estado del renderer es relativamente simple: lista de posts, keywords, logs y status del scheduler. Redux hubiera requerido actions, reducers, selectors y providers para lo mismo que Zustand hace en un archivo con 20 líneas. Elegí la herramienta proporcional al problema.

### contextBridge con API tipada en el preload
En lugar de activar `nodeIntegration: true` (que expone Node.js completo al renderer), usé `contextBridge` para exponer solo los métodos que el renderer necesita. Además definí los tipos en el preload y los exporté, entonces el renderer tiene autocompletado y type safety completo sobre `window.electronAPI`.

### IPC_CHANNELS como fuente única de verdad
Los nombres de los canales IPC están definidos una sola vez en `src/shared/types.ts` y tanto el main como el renderer los importan desde ahí. Evita bugs por strings mal escritos y hace el refactoring trivial.

### Logs en SQLite además de archivo
Los logs se guardan en la base de datos además de en archivo via `electron-log`. Esto permite mostrarlos en la UI en tiempo real sin leer archivos del disco desde el renderer, lo cual no sería posible sin nodeIntegration.

---

## Estructura del proyecto

```
src/
├── main/                    # Proceso main de Electron (Node.js)
│   ├── database/            # Conexión y migraciones de SQLite
│   ├── scraper/             # Playwright scraper, matcher y orquestador
│   ├── scheduler/           # Scheduler automático con node-cron
│   ├── services/            # Servicios de base de datos (posts, keywords, logs, settings)
│   └── ipc/                 # Registry de handlers IPC
│
├── preload/                 # Bridge seguro entre main y renderer
│
├── renderer/src/            # Proceso renderer (React)
│   ├── components/          # Componentes reutilizables
│   ├── pages/               # Páginas principales (Dashboard, Keywords, Logs, Settings)
│   ├── hooks/               # Custom hooks (usePosts, useKeywords)
│   └── store/               # Stores de Zustand (posts, keywords, app)
│
└── shared/                  # Tipos TypeScript compartidos entre main y renderer
```

---

## Trade-offs y decisiones pendientes

### Qué no alcancé
- Tests automatizados (opcional) — con más tiempo agregaría tests de integración para el scraper y tests unitarios para el matcher y los servicios de base de datos.
- Paginación en la tabla de posts — actualmente carga hasta 500 posts en memoria. Con volumen alto esto podría ser un problema.

### Qué haría diferente con más tiempo
- Usaría Drizzle ORM sobre SQL crudo para las queries — mejor type safety y migraciones más manejables.
- Agregaría un sistema de retry automático cuando el scraper falla por red.
- Implementaría paginación virtual en la tabla de posts para manejar grandes volúmenes.

---

## Uso de IA

Se usó Claude como agente durante el desarrollo para:
- Generar la estructura base de archivos y configuraciones
- Resolver errores de TypeScript y compatibilidad de dependencias
- Sugerir patrones de arquitectura para la separación main/renderer
- Apoyo más fuerte en la parte de frontend y diseño visual, que no es mi área más fuerte, sin embargo no quita el hecho de que no se entienda a nivel de código y no se revise todo antes de ejecutar :)

Todo el código fue revisado y entendido antes de ser integrado. Los errores de compilación fueron diagnosticados y corregidos en tiempo real durante el desarrollo.