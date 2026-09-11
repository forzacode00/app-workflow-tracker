# app-workflow-tracker (Flytdesigner)

Internt verktøy for Involved Consulting: kolleger uten utviklerbakgrunn tegner moduler i et nettsted som
kart av bokser (mål, person, start, steg, regel, data, resultat, system, spørsmål) med piler mellom, og
får en Markdown-brief per modul som limes inn i Claude for å bygge en MVP. Moduler peker på hverandre
(start/resultat/system-bokser med `ref`), og oversikten viser hele nettstedet med grensesnittene. Felles regler: `../CLAUDE.md`.
Konsept og veikart: `docs/konsept.md`. Panelfunn: `docs/panel-2026-09-11.md`. Review-runder på lerretet: `docs/iterasjoner-2026-09-11.md`.
GitHub `forzacode00/app-workflow-tracker`. Push til `main` deployer til GitHub Pages
(https://forzacode00.github.io/app-workflow-tracker/) etter at lint, typecheck, test, build og e2e er grønne.
Produksjonsbygget får en Content-Security-Policy som meta-tag (`vite.config.ts`); dev har den ikke.

## Stack og struktur
- Vite 8 + React 19 + TypeScript 6 (`strict`), Tailwind 4, zod, `@xyflow/react` (React Flow) for lerretet,
  vitest + Testing Library, oxlint.
- `src/lib/` ren logikk uten React:
  - `flow.ts`: boksmodell (`Flow`, `FlowNode` med valgfri `ref`, `FlowEdge`), `NODE_META` (etiketter, hint, hvilke typer
    som følger naturlig etter hver type), `orderedSteps`, `neighbours`, `tidyEdges`, `placeNear`, `uniqueIds`.
  - `flowEdit.ts`: `anchorOf` (steget en bladboks henger på) og `stitch` (sy kjeden sammen ved sletting).
  - `flowBrief.ts`: `SECTIONS` (seksjonene i en modulbrief), `openQuestions`, `renderBrief`. Appen bruker `buildModuleBrief`.
  - `overviewEdges.ts`: pilene i oversikten, sammenslått per retning, uten React Flow-import.
  - `workspace.ts`: arbeidsområde v3 (`Workspace` = moduler + aktiv), `interfaces()` avleder grensesnitt fra `ref`,
    `tidyWorkspace`, `moduleSummary`, `moduleById`. `workspaceStorage.ts`: localStorage `flytdesigner:v3`, løfter v2/v1, backup.
    `workspaceBrief.ts`: modulbrief med grensesnitt-seksjon, brief for hele nettstedet, `buildOrder`.
  - `flowExample.ts` er byggekloss for `workspaceExample.ts` (eksempelet med to moduler). `examples/crm.ts` er CRM-eksempelet
    (fem moduler), bygget med `examples/bygg.ts` (beskriv modulen, få bokser med plass og piler). `EXAMPLES` i `useWorkspace.ts`
    lister eksemplene som «Vis eksempel»-menyen viser. `lib/examples/` bruker relative importer, så `scripts/` kan kjøre dem med tsx.
  - `flowStorage.ts`: v2-validering, brukes bare av `workspaceStorage`.
  - `migrateV1.ts`: løfter det gamle skjemaet (v1) til bokser. `lib/v1/` er det gamle skjemaet og finnes bare for
    migreringen. Ikke bygg nytt på det.
  - `canvasChanges.ts`: oppsummerer React Flow-endringer (flyttet, fjernet, valgt) uten React Flow-import, så det kan testes.
  - `text.ts`: `lines`, `block`, `inline`, `cell`, `clip`, `todayIso`. All brukerinput i briefen går gjennom disse.
- `src/hooks/useWorkspace.ts` eier arbeidsområdet og den aktive modulen (`flow`): `edit()` for innholdsendringer (nullstiller eksempel-flagget), `commit()` for
  flytting, dirty-vakt før første lagring, angre for tøm/eksempel/import/fjerning, `generation` (bytte av kart →
  `fitView`) og `lastAdded` (panorer til ny boks, én gang). Tak på antall bokser, piler og moduler. `editWs(fn, { undoable })`
  tar angre-kopi inne i oppdateringen. `addModule(navn, { stay: true })` lager modul uten å bytte. `useToast` (4 s, 8 s med handling),
  `useClipboard`.
- `src/components/canvas/`: `FlowCanvas` (React Flow eier posisjoner under dra, kartet får dem ved slipp; innhold og
  koblinger kommer alltid fra hooken),
  `NodeCard` (én boks, med «+» for å vokse), `NodePanel` (tittel, notat, type, legg til etter), `Palette`, `typeClass`.
  `components/overview/`: `OverviewCanvas` og `ModuleCard` (nettstedet: moduler og grensesnitt).
  `BriefDrawer` viser modulbrief, nettstedsbrief og JSON-deling. `components/ui/` er håndskrevne shadcn-lignende basiskomponenter.
- Filnavn: PascalCase for komponenter, camelCase for hooks og lib. Tester ligger ved siden av filen de tester.
- Semantiske fargetokens i `src/index.css`, inkludert én farge per bokstype (`--node-*`). Ingen palettfarger i JSX.
  Fonter er selvhostet via `@fontsource`. React Flow-stilen overstyres nederst i `index.css`.

## Kommandoer
- `npx tsx scripts/eksporter-briefer.ts crm docs/eksempler/crm` skriver briefene for et eksempel til Markdown, til gjennomlesing.
- `npm run dev` (port 8080, faller tilbake på 8081 hvis opptatt).
- `npm test` (vitest), `npm run typecheck`, `npm run lint`, `npm run build`, `npm run e2e` (Playwright, Chromium, starter dev-server på 4173).

## Porter før «ferdig»
`npm run lint` · `npm run typecheck` · `npm test` · `npm run build` · `npm run e2e`
Ved UI-endring: `npx tsx e2e/skjermbilder.ts <mappe> http://127.0.0.1:8080/` tar skjermbilder ved 360 px og 1280 px i lys og
mørk modus (tom modul, eksempel, oversikt, brief). Se gjennom dem før «ferdig».

## Avvik og fallgruver
- React Flow i jsdom trenger stubber (ResizeObserver, DOMMatrixReadOnly, offsetWidth). De ligger i `src/test/setup.ts`.
- Lagret form endres ved å legge til felt med zod `.default()`. Endring gammel data ikke passerer: ny nøkkel + migrering.
- Playwright dekker det jsdom ikke kan bevise: dra, koble, slette, slipp pil, import. Nye lerret-interaksjoner får e2e-test.
- Ingen backend. Deling mellom kolleger skjer via JSON i brief-skuffen. Neste steg er Supabase med RLS (se `docs/konsept.md`).
- `Textarea`/`Input` har skjemaets maks-lengde som standard. Felt uten grense (JSON-import) må sende `maxLength={undefined}` eksplisitt.
