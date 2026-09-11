# Tre runder review og retting av lerretsversjonen

Magnus ba om et team som vurderer kartversjonen, bygger opp kunnskap, og retter funnene, i tre
runder, før han selv vurderer. Teamet per runde: research (kun runde 1), førstegangsbruker som
klikker seg gjennom appen i nettleseren, kode-arkitekt, qa-lead, sikkerhetsrevisor og ux-revisor.
Hver runde får denne loggen som grunnlag.

Underveis kom et nytt krav fra Magnus: appen skal brukes til å designe mange moduler som til
sammen blir ett større nettsted, der én moduls resultat er en annens start, og man skal kunne
se hele nettstedet med grensesnittene mellom. Det tas i runde 2 (se `konsept.md`).

## Runde 1

### Funn teamet var enige om
- «+»-knappen lå oppå koblingshåndtaket, så man kunne ikke trekke pil fra en boks (UX).
- Hver musebevegelse under dra gikk gjennom hele datapipen: rydding av kanter, lagringstimer,
  ny brief (arkitekt).
- Sletting med Delete kunne ikke angres (arkitekt, UX).
- Import av gammelt skjema omgikk grensene og kunne gi datatap ved neste åpning (sikkerhet).
- Duplikate id-er i importert JSON ga usynlige bokser (arkitekt, sikkerhet).
- Ingen tastaturfokus på bokser, engelske skjermlesertekster (UX, research).
- Førstegangsopplevelsen var 17 bokser på et lite lerret, stikk i strid med «start smått» (UX).
- Dra, koble og slette var utestet, fordi jsdom ikke kan bevise det (QA).

### Rettet
- Lerretet eier posisjoner under dra; kartet oppdateres ved slipp. Endringer fra React Flow
  oppsummeres i `lib/canvasChanges.ts` med egen test.
- «+» i hjørnet, uten pekerhendelser når den er usynlig. Håndtak 16 px, 24 px på berøring, med
  44 px trykkflate. Synlig fokusring på bokser. Norsk `ariaLabelConfig`. Piler er ikke tab-stopp.
- Enter i tittelen legger til neste boks, Esc lukker panelet. Slipp en pil på tomt lerret lager
  boksen der. Ny boks utenfor utsnittet gir panorering. Bytte av kart gir `fitView` uten remontering.
- Fjerning (Delete, «Fjern boksen», piler) kan angres fra meldingen. Blir kartet tomt, settes ny målboks inn.
- Skjema: unike id-er (med sti til raden i feilmeldingen), koordinater innenfor ±1 000 000,
  kanter ryddes også på id. Tak på 200 bokser og 400 piler også i hooken. Kodegjerder escapes i briefen.
- Migrert v1 klippes til grensene, stopper ved 200 bokser (resten i målnotatet) og valideres
  gjennom samme skjema. v1-nøkkelen ryddes etter første vellykkede lagring.
- Første besøk: én målboks, panelet åpent med fokus i tittelen, kort hint. Eksempelet bak «Vis eksempel».
- Panelet før paletten i tastaturrekkefølge, paletten skjult på mobil når panelet er åpent,
  «Kopier brief» ute av headeren på mobil, «Endre type» bak en utvidbar linje, toast med riktig bredde.
- v1-filene flyttet til `lib/v1/`. Briefen er igjen en `SECTIONS`-liste. `ui/Select` erstatter rå `<select>`.
- Bundlen delt i `react`, `reactflow` og `index` (alle under 210 kB).
- Playwright med fem tester i Chromium: dra og last på nytt, koble og se briefen, Delete med angre og
  Backspace i felt, slipp pil på lerret, import og angre. Kjører i CI før deploy.
- Testene fant én feil til: JSON-import var begrenset til 4000 tegn av tekstfeltets standard-`maxLength`.

### Utsatt
| Forslag | Fra | Hvorfor ikke nå |
|---|---|---|
| «+» på alle fire sider med typevalg | research | Runde 2, sammen med modulmodellen. |
| Redigér tittel direkte på boksen | research | Runde 2. |
| Ikon per type | research | Runde 2, lav størrelse. |
| Dele hooken i redigering og lagring, `id` og `oppdatert` på flyten | arkitekt | Gjøres i runde 2 som del av modulmodellen. |
| Tredjeparts lisensfil | sikkerhet | Lav. Legges til når det er flere avhengigheter. |
| Bundle-budsjett som feiler i CI | QA | Chunking løste advarselen. Budsjett vurderes i runde 3. |
