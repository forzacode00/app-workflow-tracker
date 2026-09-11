# app-workflow-tracker (Flytdesigner)

Internt verktøy for Involved Consulting: kolleger uten utviklerbakgrunn beskriver en arbeidsflyt
(formål, aktører, inputs, data, steg og regler, outputs, koblinger) og får en Markdown-brief som
limes inn i Claude for å bygge en MVP. Felles regler: `../CLAUDE.md`. Konsept: `docs/konsept.md`.
GitHub `forzacode00/app-workflow-tracker`. Tenkt koblet til Lovable, push til `main` deployer da.

## Stack og struktur
- Vite 8 + React 19 + TypeScript 6 (`strict`), Tailwind 4 (`@tailwindcss/vite`), zod, vitest, oxlint.
- `src/lib/` ren logikk uten React: `types.ts` (zod-skjema og lister), `brief.ts` (Markdown-generator),
  `checks.ts` (komplett-sjekk), `storage.ts` (localStorage, import/eksport), `example.ts`.
- `src/hooks/` (`useWorkflow`, `useToast`, `useClipboard`), `src/components/` JSX, `src/components/ui/` basiskomponenter.
- Filnavn: PascalCase for komponenter, camelCase for hooks og lib.
- All brukerdata ligger i localStorage under `flytdesigner:v1`. Endrer du lagret form: ny versjon + migrering i `storage.ts`.
- Semantiske fargetokens defineres i `src/index.css` (`bg-card`, `text-muted-foreground`, `text-warning` osv.). Ingen palettfarger i JSX.

## Kommandoer
- `npm run dev` (port 8080, samme som de andre Vite-prosjektene, kjør ett om gangen).
- `npm test` (vitest), `npm run typecheck`, `npm run lint`, `npm run build`.

## Porter før «ferdig»
`npm run lint` · `npm run typecheck` · `npm test` · `npm run build`

## Avvik og fallgruver
- Ingen Playwright ennå. Rutene er én side, så det er akseptabelt til appen får flere sider eller innlogging.
- Ingen backend. Deling mellom kolleger skjer via JSON-fanen. Neste steg er Supabase med RLS per bruker (se `docs/konsept.md`).
- `components/ui/` er håndskrevne minimumsvarianter av shadcn-mønsteret, ikke generert av shadcn CLI.
