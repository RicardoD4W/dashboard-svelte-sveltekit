# AGENTS.md

## Reglas inquebrantables

### Commits y Push

- **NUNCA hacer push.** No negociable. No importa qué ocurra.
- **Solo hacer commit local cuando el usuario lo indique expresamente.** No crear commits por iniciativa propia, no hacer commit automático, no commitear "guardar progreso".

### Workflow de cambios

1. Hacer cambios en el código
2. El usuario indica cuándo y cómo commitear
3. Si el usuario pide commit, preguntar: ¿mensaje? ¿qué archivos?
4. Nunca hacer `git add -A` sin confirmar cuáles archivos incluye

## Stack

- **SvelteKit 5** con **Svelte 5** (runes mode por defecto en `src/`, no en `node_modules`)
- **pnpm** como package manager
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Vitest** con dos ambientes: `client` (browser/Playwright) y `server` (node)
- **Playwright** para e2e en `tests/e2e/`

## Commands

```sh
pnpm dev          # dev server en http://localhost:5173
pnpm build        # producción
pnpm check        # svelte-check (types)
pnpm lint         # prettier + eslint
pnpm format       # formatear
pnpm test         # vitest (unit), corre todos los tests
```

E2E: `pnpm playwright test` (levanta el dev server automáticamente).

## Coverage

Solo cubre `src/lib/data/**` y `src/lib/server/**`. No cubre componentes UI en `src/lib/components/`.

## Alias

`$lib` → `src/lib/`. Usar para imports, no paths relativos.

## Estructura notable

```
src/lib/
  components/   # componentes UI Svelte
  data/         # mock generators, solo server-side
  server/       # lógica server-only (query-params, etc)
  stores/       # Svelte 5 runes ($state)
src/routes/     # SvelteKit routes (SPA pages + API endpoints)
tests/e2e/      # Playwright e2e
```
