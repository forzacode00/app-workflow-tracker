# app-workflow-tracker (Flytdesigner)

Internt verktøy for Involved Consulting: kolleger uten utviklerbakgrunn beskriver en arbeidsflyt
(formål, aktører, inputs, data, steg og regler, outputs, koblinger) og får en Markdown-brief som
limes inn i Claude for å bygge en MVP. Felles regler: `../CLAUDE.md`. Konsept: `docs/konsept.md`.
Panelfunn og hva som er utsatt: `docs/panel-2026-09-11.md`.
GitHub `forzacode00/app-workflow-tracker`. Push til `main` deployer til GitHub Pages
(https://forzacode00.github.io/app-workflow-tracker/) etter at lint, typecheck, test og build er grønne.

## Stack og struktur
- Vite 8 + React 19 + TypeScript 6 (`strict`), Tailwind 4 (`@tailwindcss/vite`), zod, vitest + Testing Library, oxlint.
- `src/lib/` ren logikk uten React: `types.ts` (zod-skjema, lister, `SHORT`/`LONG`/`MAX_ITEMS`),
  `brief.ts` (Markdown-generator som liste av `SECTIONS`, `block()`/`cell()` escaper brukerinput),
  `checks.ts` (komplett-sjekk), `storage.ts` (localStorage, backup, import med norske feilmeldinger), `example.ts`.
- `src/hooks/` (`useWorkflow` med `edit()`, dirty-vakt og angre; `useToast`; `useClipboard`), `src/components/` JSX,
  `src/components/ui/` basiskomponenter (Button, Input, Textarea, Select, Checkbox, Field), `src/components/editors/` listeeditorer.
- Filnavn: PascalCase for komponenter, camelCase for hooks og lib. Tester ligger ved siden av filen de tester.
- All brukerdata i localStorage under `flytdesigner:v1`. Nye felt kan legges til med `added()` i `types.ts`
  (tom streng som standard) uten ny versjon. Endring som gammel data ikke passerer: ny nøkkel + migrering i `storage.ts`.
- Uleselig lagret verdi kopieres til `flytdesigner:v1:backup` og overskrives aldri før brukeren har endret noe.
- Semantiske fargetokens i `src/index.css` (`bg-card`, `text-muted-foreground`, `text-warning` osv.), kontrastsjekket i begge moduser.
  Ingen palettfarger i JSX. Fonter er selvhostet via `@fontsource`.
- Alle redigeringer i `useWorkflow` går gjennom `edit()`, som nullstiller `eksempel`-flagget. Ikke sett flagget andre steder.

## Kommandoer
- `npm run dev` (port 8080, samme som de andre Vite-prosjektene, kjør ett om gangen).
- `npm test` (vitest), `npm run typecheck`, `npm run lint`, `npm run build`.

## Porter før «ferdig»
`npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
Ved UI-endring: åpne siden ved 360 px og 1280 px, lys og mørk.

## Avvik og fallgruver
- Ingen Playwright. Én side uten ruter eller innlogging, så vitest + Testing Library holder til det endrer seg.
- Ingen backend. Deling mellom kolleger skjer via JSON-fanen. Neste steg er Supabase med RLS per bruker (se `docs/konsept.md`).
- `components/ui/` er håndskrevne minimumsvarianter av shadcn-mønsteret, ikke generert av shadcn CLI.
- Listene bruker `key={i}`. Bytt til `id` per rad i samme migrering som «flere flyter» (v2), ikke som løsrevet endring.
- `Select` er generisk og tar `onValueChange`, ikke `onChange`. Ikke cast verdier fra `e.target.value` i editorer.
