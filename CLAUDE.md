# app-workflow-tracker (Flytdesigner)

Internt verktøy for Involved Consulting: kolleger uten utviklerbakgrunn tegner en arbeidsflyt som et
kart av bokser (mål, person, start, steg, regel, data, resultat, system, spørsmål) med piler mellom,
og får en Markdown-brief som limes inn i Claude for å bygge en MVP. Felles regler: `../CLAUDE.md`.
Konsept og veikart: `docs/konsept.md`. Panelfunn: `docs/panel-2026-09-11.md`.
GitHub `forzacode00/app-workflow-tracker`. Push til `main` deployer til GitHub Pages
(https://forzacode00.github.io/app-workflow-tracker/) etter at lint, typecheck, test og build er grønne.

## Stack og struktur
- Vite 8 + React 19 + TypeScript 6 (`strict`), Tailwind 4, zod, `@xyflow/react` (React Flow) for lerretet,
  vitest + Testing Library, oxlint.
- `src/lib/` ren logikk uten React:
  - `flow.ts`: datamodell v2 (`Flow`, `FlowNode`, `FlowEdge`), `NODE_META` (etiketter, hint, hvilke typer som
    følger naturlig etter hver type), `orderedSteps`, `neighbours`, `tidyEdges`, `seedFlow`.
  - `flowBrief.ts`: briefen fra kartet, som liste av seksjoner. `openQuestions` samler alt uavklart.
  - `flowStorage.ts`: localStorage `flytdesigner:v2`, backup ved uleselig verdi, import av både v2 og v1.
  - `migrateV1.ts`: løfter det gamle skjemaet (v1) til bokser. `types.ts`, `storage.ts`, `example.ts` er v1 og
    finnes bare for migreringen. Ikke bygg nytt på dem.
  - `text.ts`: `lines`, `block`, `inline`, `cell`. All brukerinput i briefen går gjennom disse.
- `src/hooks/useFlow.ts` eier kartet: `edit()` for alle endringer (nullstiller eksempel-flagget), dirty-vakt før
  første lagring, angre for tøm/eksempel/import, `generation` som lerretet bruker som `key` for å tilpasse utsnittet.
- `src/components/canvas/`: `FlowCanvas` (React Flow, kartet i hooken er sannheten, RF får avledet kopi),
  `NodeCard` (én boks, med «+» for å vokse), `NodePanel` (tittel, notat, type, legg til etter), `Palette`, `typeClass`.
  `BriefDrawer` viser briefen og JSON-deling. `components/ui/` er håndskrevne shadcn-lignende basiskomponenter.
- Filnavn: PascalCase for komponenter, camelCase for hooks og lib. Tester ligger ved siden av filen de tester.
- Semantiske fargetokens i `src/index.css`, inkludert én farge per bokstype (`--node-*`). Ingen palettfarger i JSX.
  Fonter er selvhostet via `@fontsource`. React Flow-stilen overstyres nederst i `index.css`.

## Kommandoer
- `npm run dev` (port 8080, faller tilbake på 8081 hvis opptatt).
- `npm test` (vitest), `npm run typecheck`, `npm run lint`, `npm run build`.

## Porter før «ferdig»
`npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
Ved UI-endring: åpne siden ved 360 px og 1280 px, lys og mørk.

## Avvik og fallgruver
- React Flow i jsdom trenger stubber (ResizeObserver, DOMMatrixReadOnly, offsetWidth). De ligger i `src/test/setup.ts`.
- Lagret form endres ved å legge til felt med zod `.default()`. Endring gammel data ikke passerer: ny nøkkel + migrering.
- Ingen Playwright. Én side uten ruter eller innlogging. Tas inn med innlogging.
- Ingen backend. Deling mellom kolleger skjer via JSON i brief-skuffen. Neste steg er Supabase med RLS (se `docs/konsept.md`).
- `key={generation}` på `ReactFlow` remonterer lerretet ved bytte av kart. Ikke bruk det for vanlige redigeringer.
