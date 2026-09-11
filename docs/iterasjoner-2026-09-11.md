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

## Runde 2: moduler og grensesnitt

### Bygget (Magnus' krav om moduler som snakker sammen)
- **Arbeidsområde (v3).** Ett arbeidsområde inneholder mange moduler. Hver modul er et kart som før,
  med egen id og plass i oversikten. Lagres under `flytdesigner:v3`; v2 (ett kart) og v1 (skjema)
  løftes automatisk til én modul.
- **Referanser.** Start-, resultat- og systembokser kan peke på en annen modul («Peker på en annen
  modul?» i panelet). En start som peker betyr «mottar fra», et resultat betyr «sender til», et
  system avgjøres av pilene (inn = sender, ut = mottar, begge).
- **Grensesnitt i briefen.** Modulbriefen får seksjonen «Grensesnitt mot andre moduler» før «Åpne
  spørsmål», med retning, hva som utveksles og et sammendrag av den andre modulen (mål, start,
  resultater). Ny brief «Hele nettstedet» lister alle moduler og grensesnittene med retningspiler.
- **Oversikt.** Egen visning der hver modul er én boks (navn, mål, antall bokser, åpne spørsmål)
  og grensesnittene er piler i dataenes retning. Dra for å ordne, «Åpne» eller dobbeltklikk for å gå
  inn, «+ Ny modul» for neste. Modulvelger i headeren når det er flere.
- **Import.** Et helt arbeidsområde erstatter ditt; ett kart legges til som ny modul. Begge kan angres.
- **Eksempelet** har nå to moduler som snakker sammen: «Tilbudsforespørsel» og «Oppfølging etter tilbud».

### Rettet fra førstegangsbrukerens rapport (runde 1)
- Sletting syr kjeden sammen: det som pekte inn i boksen, pekes videre til det den pekte på.
- Regler, resultater og systemer fra paletten festes på steget de henger på, ikke som «neste steg».
- Minste zoom ved «vis hele» så bokser forblir lesbare. Zoom-knappene flyttet opp så paletten ikke dekker dem.
- «+» på boksen er alltid synlig (dempet), ikke bare ved hover.
- Fokus går til tittelen hver gang en boks velges, Esc lukker fra hele panelet.
- Egen «Kopier JSON»-knapp i skuffen. Meldinger vises i 4 sekunder.

### Tester
- 129 vitest (var 99): arbeidsområde, lagring med løfting fra v2/v1, brief med grensesnitt,
  hooken (moduler, referanser, søm ved sletting), og appen (referanse blir grensesnitt i brief og oversikt).
- 6 Playwright-tester (ny: oversikten viser moduler og piler, åpner modul, referanse vises i panelet).

### Rettet etter runde 2-gjennomgangen
- **Angre stemmer alltid.** Kopien tas inne i oppdateringen, ikke fra en ref som oppdateres etterpå.
  Fjerning av boks og pil i samme hendelse gir hele tilstanden tilbake. Endringer som ikke endrer noe,
  overskriver ikke kopien.
- **Søm ved sletting** går gjennom flere fjernede bokser, lager ikke duplikater og holder seg under taket på piler.
- **Ankerregelen** foretrekker steget som peker inn i bladboksen. Personer er ikke blad lenger, så «Utføres av» i briefen stemmer.
- **Kant-id-er i oversikten** er unike på tvers av moduler. Flere grensesnitt samme vei mellom to moduler
  slås sammen til én pil med etiketter. Ukjent retning tegnes stiplet uten pilhode.
- **Modulnavn i briefen** går gjennom escaping også i grensesnitt-seksjonen (målt injeksjon fra sikkerhet).
  Innkommende grensesnitt sier hva den andre modulen gjør mot denne. Piler i nettstedsbriefen går alltid i
  dataenes retning, som i oversikten. Ny seksjon «Foreslått byggerekkefølge».
- **Import** krever `versjon: 2` for kart, avviser vilkårlige objekter, fjerner fremmede referanser, gir ny id ved kollisjon.
  Uleselig v2/v1 kopieres til backup før eldre nøkler ryddes. Referanser fra typer som ikke kan peke, ryddes.
- **UI:** «Start egen modul» fjerner hele eksempelet. «Fjern» på valgt modul i oversikten, med angre.
  «Mottar fra / Sender til / Snakker med en annen modul?» per bokstype; med én modul tilbys «+ Lag ny modul».
  Boksen viser navnet på modulen den peker på. Skuffen åpner «Hele nettstedet» fra oversikten, ordentlige
  faner med piltaster, egen tekst for hvilken modul briefen gjelder. Meldinger øverst, ikke over paletten.
  Header trimmet på mobil. Mer luft mellom nye moduler. Briefer bygges bare når skuffen er åpen.
- **Ord:** «modul» og «nettsted» overalt i UI og brief; «flyt» og «arbeidsområde» er borte fra det brukeren ser.
- **Tester:** 133 vitest, 7 Playwright (ny: dra modul i oversikten, fjern med angre). `waitForTimeout` erstattet med polling.

### Utsatt fra runde 2
| Forslag | Fra | Hvorfor ikke nå |
|---|---|---|
| Dele hooken i redigering og lagring, async port | arkitekt | Forutsetning for Supabase; tas når delt lagring starter. |
| `aktiv` ut av lagret nettsted, UUID på moduler | arkitekt | Samme. |
| Pil mellom moduler i oversikten som lager grensesnitt | UX | Runde 3 vurderer om det trengs etter at retningen er tydeligere i panelet. |
| Bunnskuff som kan dras på mobil | førstegangsbruker | Middels. Panelet er 45 vh og lerretet sentrerer på ny boks nå. |
