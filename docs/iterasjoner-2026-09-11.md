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

## Runde 3: siste gjennomgang

### Verifisert av teamet
Alle rettinger fra runde 2 holder, med to unntak arkitekten fant og som er rettet under.
Sikkerhet bekreftet escaping av modulnavn, backup før rydding, stripping av `ref` fra typer som
ikke kan peke, og at etiketter på piler er tekstnoder. QA bekreftet at alle runde 2-testønsker var dekket.

### Rettet
- **Lerretet sentrerte på nytt ved hvert tastetrykk** etter at en boks var lagt til (bieffekt av
  runde 2-rettingen for mobil). Sentrerer nå én gang per ny boks.
- **«Tøm modulen» på en tom modul** overskrev angre-kopien. Er nå en no-op.
- **«+ Lag ny modul» fra panelet** lager modulen og lar boksen peke på den, uten å forlate boksen.
- **Retningstegn på boksen:** «← fra» for start, «→ til» for resultat, «↔» for system.
- **Byggerekkefølge** tar hensyn til både start (mottar fra) og resultat (sender til). Ved sirkel
  velges først modulen som ikke selv starter fra noen. Testene er asykliske og krever sortering.
- **Unike boks-id-er** sjekkes også i nettsted-import (v3), ikke bare i kart (v2).
- **Content-Security-Policy** som meta-tag i produksjonsbygget (ikke i dev, der React-pluginen
  trenger inline-script). `.env*` i `.gitignore` før Supabase.
- **«Fjern» på modul** vises alltid (kan angres). Etiketter på piler bruker tokens i mørk modus.
  Fokus følger piltastene i fanene. Skjermlesertekst for antall åpne spørsmål.
- **Opprydding:** `anchorOf` og `stitch` flyttet til `lib/flowEdit.ts`, `overviewEdges` til
  `lib/overviewEdges.ts`, begge med egne tester. `buildFlowBrief`, `seedFlow`, `children` og v1
  `isBlank` er fjernet. `moduleById` og `todayIso` erstatter gjentatte uttrykk. `CLAUDE.md` oppdatert.
- **Tester:** 141 vitest, 7 Playwright.

### Utsatt, med begrunnelse
| Forslag | Fra | Hvorfor ikke nå |
|---|---|---|
| Dele hooken i redigering og lagring, `aktiv` ut av lagret data, UUID på moduler | arkitekt | Forutsetning for Supabase; tas som første oppgave der. |
| Pil mellom moduler i oversikten som lager grensesnitt | UX | Retningen er nå tydelig i panelet. Vurderes etter bruk. |
| Bunnskuff som kan dras på mobil | førstegangsbruker | Panelet er 45 vh og lerretet sentrerer på ny boks. |
| Bundle-budsjett som feiler i CI | QA | Største chunk er 65 kB gzip, langt under grensen. |

### Til Supabase (fra sikkerhetsrevisor)
1. RLS på hver tabell, policy per operasjon, aldri `USING (true)`. Test som leser en annen brukers rad og forventer tomt svar.
2. Alt skjema i `supabase/migrations/`. Søk `TO anon`, `SECURITY DEFINER`, `GRANT … TO anon` før hver policy-endring.
3. Kun `VITE_SUPABASE_URL` og publishable-nøkkel i klient, som GitHub Actions-variabler. Service-role bare i function secrets.
4. Edge function for «Hva mangler?» validerer med `supabase.auth.getUser()`, zod med samme tak, rate-limit, CORS låst til Pages-domenet.
5. Innlogging kun på invitasjon, og størrelsesgrense på lagret JSON server-side.

### Manuell sjekk etter runde 3
Skjermbilder tatt med `npx tsx e2e/skjermbilder.ts <mappe>` (Chromium, lys og mørk, 360 px og 1280 px,
tom modul, eksempelmodul, oversikt og brief). Sett gjennom: tokens holder i mørk modus, også etiketter på
piler og modulkort. Oversikten viser én pil hver vei mellom eksempelets to moduler, med hver sin etikett,
festet i sidene som vender mot hverandre. Mobil: to rader header med eksempelet, tre på tomt lerret før
siste retting (nå to). Hint viker for zoom-knappene. Tab-rekkefølge i oversikten er bekreftet av
førstegangsbrukeren i runde 3: modul → Fjern → Åpne → neste modul.

### Fra førstegangsbrukeren i runde 3, rettet
- Mer luft mellom moduler i oversikten, og pilene forskyves når de går begge veier.
- «+ Resultat» også fra regel-panelet.
- Panorering når en valgt boks ligger bak panelet.
- Angre-vindu på 10 sekunder når meldingen har en handling.

### Ikke rettet, bevisst
- Regel-panelet tilbyr fortsatt ikke alle typer; paletten gjør det.
- Mobil-header er to rader. Én rad ville krevd at modulvelgeren forsvant.

## Runde 4: et CRM gjennom appen, og spørsmålet om opplæring

Bestilling fra Magnus: bygg et CRM-system gjennom appen, se hvordan flyten kommer ut, la teamet
bearbeide det, og vurder om brukerne trenger bedre opplæring i hvordan de skal tenke.
Team: CRM-ekspert (innhold), Claude-bygger (leser briefene som om den skal bygge), ux-revisor,
førstegangsbruker.

### CRM-et, slik det ble tegnet
Fem moduler i `src/lib/examples/crm.ts`, beskrevet med byggeklossen `examples/bygg.ts`
(beskriv modulen som mål, personer, start, steg med regler/data/resultat/system, få bokser med plass
og piler). Kontakter → Muligheter → Tilbud, Aktiviteter på tvers, Rapportering leser fra alle. Ti
grensesnitt. Ligger i «Vis eksempel»-menyen, og briefene er eksportert til `docs/eksempler/crm/`
med `npx tsx scripts/eksporter-briefer.ts crm docs/eksempler/crm`.

### Slik kom flyten ut, første gjennomlesning
- **CRM-eksperten:** «Oppfølging» var egentlig en modul på tvers av alle de andre. Omdøpt til
  Aktiviteter, starter av seg selv (planlagt aktivitet), leser fra Tilbud. Utfall på en mulighet
  settes ett sted (Muligheter), ikke både i Tilbud og Muligheter. GDPR-sletting som eget steg i
  Kontakter. Stegene sier hvem som gjør hva («Selger …», «Appen …»).
- **Claude-byggeren (4/6 første gang):** grensesnittene sa hvilken pil, ikke hvilke felter.
  Datafelter sto i én lang setning. Regler ble gjentatt under steget og i egen seksjon.
  Oppfølging var uklar.
- **Førstegangsbrukeren** (på tomt lerret, ikke CRM): «4 åpne spørsmål» på knappen før man har
  skrevet noe føles som stryk. Enter-kjeden tar aldri slutt. «Start egen modul» sletter eksempelet
  man ville sammenligne med. Blander resultat og mål. Glemmer data helt.

### Det som ble rettet i briefene
- Grensesnitt-seksjonen er én kontrakt per pil: `**Sender til «X»**: «tittel» (resultat).` med
  feltene fra boksens notat og databoksene den henger på, og målet i den andre modulen én gang.
  Innkommende: `**«X» mottar herfra**`, `**«X» leser herfra**`. Avsluttes med at hver pil er en
  kontrakt med samme feltnavn i begge ender.
- Nettstedsbriefen: én linje per kontrakt i dataenes retning, `(leser)` når modulen bare leser.
- Regler står bare under steget sitt; egen seksjon lister bare løse regler. Data viser hvilke steg
  som bruker dem. Resultat viser hvem det går til.
- Nytt åpent spørsmål: «Ingen databoks. Hva må huskes fra ett steg til et annet?»

### Andre gjennomlesning av Claude-byggeren: 5/6
Etter rettingene over leste byggeren de eksporterte briefene på nytt. Karakter 5/6: «Tilbud-modulen er
nå byggbar, jeg kunne startet uten å lese de andre briefene.» Løst: felter i grensesnittene. Delvis:
gjentakelser (databoksens innhold sto tre ganger i Tilbud-briefen, og samme pil sto fra begge ender),
og Aktiviteter var både push («Tilbud sendt») og pull (systemboks som leser Tilbud). Innholdsfeil som
en kollega uten utviklerbakgrunn typisk gjør: sirkulær start (Tilbud starter fra fase «tilbud», men
Muligheter sa at fasen ble satt av Tilbud), styreleder nevnt uten personboks, PDF til kunden koblet til
selger, spørsmål gjemt i et systemnotat («… Spør.») mens «Åpne spørsmål» sa «Ingen kjente», steg som
endrer data uten datakobling. Rettet slik:
- **Briefen samler én kanal per modulpar og retning.** «Mottar fra «Muligheter»» står én gang, med
  begge endene under (startboksen her, resultatboksen der). Nettstedsbriefen gjør det samme per pil.
  Databokser i egen modul nevnes ved navn med «se «Data som lagres»»; innholdet gjentas ikke.
- **Byggerekkefølgen** skiller hard avhengighet (starter fra) og myk (får resultat fra). CRM-et blir
  Kontakter → Muligheter → Tilbud → Aktiviteter → Rapportering, ikke Aktiviteter som nummer to.
- **CRM-innholdet:** selgeren drar kortet til «tilbud», det starter Tilbud; Tilbud setter aldri fasen.
  Kunde er person og får PDF-en. Under grensen går tilbudet rett fra utkast til sendt. «Svar på
  tilbudet» sender også «erstattet» og årsak ved avslag. Aktiviteter får «Tilbud sendt» pushet, leser
  ikke selv. To spørsmålsbokser i Tilbud (hvem godkjenner daglig leders egne tilbud, PDF fra mal i appen).
- Ikke gjort: felt per linje i databokser. Notatet blir én linje per linje man skriver, så kollegaen
  kan skrive ett felt per linje selv. Vurderes som mal i panelet senere. Heller ikke automatisk
  varsel om steg som endrer data uten datakobling; for usikkert hva som er «endrer».

### Trenger brukerne opplæring? Svar: ikke et kurs, men appen må si hvordan man tenker
Ingen i teamet ville ha en manual. Det som manglet var at appen selv stiller spørsmålene.
Tankemodellen er fem spørsmål: hva vil du oppnå og hvordan ser du at det virker, hvem bruker det,
hva setter det i gang og hva skjer så, hva må huskes og hva sitter noen igjen med, hva henger det
sammen med. Boksene er bare svarene på disse. Gjort i appen:
- **Plassholdere og hint i spørsmålsform** («Hva setter det i gang?», «Når hva, skal hva?»,
  «Hva kommer ut, til hvem?»). Startboksen sier eksplisitt at den ikke er målet, resultatboksen at
  den ikke er handlingen.
- **Dytt øverst på lerretet:** «Neste: Hva setter det i gang? [+ Start]». `nextStep()` i
  `flowBrief.ts` finner det ene som mangler i rekkefølgen start → person → steg → steg → regel →
  data → resultat, og knappen legger boksen der den hører hjemme. Forsvinner når modulen har det
  viktigste. Tom boks teller ikke som svart.
- **«?» / «Slik tenker du»** i headeren: de fem spørsmålene og seks vanlige feil (steg som er regel,
  start som er mål, resultat som er handling, alt i ett steg, ingen data, hva en pil betyr).
- **Brief-skuffen** lister de åpne spørsmålene øverst, før briefen, så man ser hva som mangler før
  man kopierer. Tallet på «Vis brief» vises først når målet har tittel.
- **«Start egen modul»** i et eksempel legger nå til en modul ved siden av, så man kan bygge sin egen
  mens CRM-et står der. «Fjern eksempelet» finnes i oversikten når alt som er igjen er eksempel.
- Personboks foreslår bare steg etterpå (ikke start), så Enter-kjeden går dit tankemodellen går.

### Tester og sjekk
- 153 vitest (nye: `nextStep`, «Ingen databoks», CRM-grensesnitt med felter, «Start egen modul»
  legger til, «Fjern eksempelet», dytt og hjelp), 7 Playwright (import-testen bruker «Fjern
  eksempelet»).
- Skjermbilder ved 360 px og 1280 px, lys og mørk, nå også dytt og hjelp: dyttet ligger over
  lerretet uten å dekke boksen, hjelpen ruller på mobil, tokens holder i mørk modus.

## Runde 5: kollegaen skjønte ingenting. Spørsmål først, kart etterpå.

Magnus lot en kollega prøve appen. Han forsto ikke hva den skulle brukes til. Det er en annen feil
enn de forrige rundene rettet: problemet lå foran alle hintene. Første skjerm var et tomt lerret med
én boks, ni fagord i paletten og en header med «Oversikt», «Brief» og «Modul». Ingenting sa hva man
får ut. Magnus bestemte: først en forklaring på hva appen er til for, så spørsmål, så kartet.

### Det som er bygget
- **Velkomstskjerm** (`Velkommen.tsx`) ved aller første besøk med tomt nettsted: én setning om hva
  appen er til («Beskriv noe som er tungvint på jobben. Få en bestilling Claude kan bygge en app
  fra»), de tre tingene som skjer i rekkefølge, og tre valg: «Start med spørsmålene», «Se et ferdig
  eksempel», «Tegn selv på lerretet». Vises ikke igjen (flagg `flytdesigner:velkommen`), og aldri
  når noe er lagret fra før.
- **Intervju** (`Intervju.tsx`, ren logikk i `lib/intervju.ts`): elleve spørsmål ett om gangen, på
  vanlig norsk, med hjelpetekst og eksempel. Fem må besvares (hva er tungvint, hvem, hva setter det
  i gang, hva skjer så, hva kommer ut), resten kan hoppes over. Listespørsmål tar ett punkt om gangen
  med Enter, og et lite valg der det trengs: «Hvem gjør det?» på hvert steg, «Gjelder i steget» på
  regler, data og systemer, «Til hvem?» på resultater. Svarene blir en modul via `lib/bygg.ts`
  (flyttet ut av `examples/`, utvidet med `hvem`, flere regler og resultater per steg, og
  `eksempel: false`). Tekst med kolon deles i tittel og notat («Forespørselen: firma, e-post» blir
  databoks med «Felter: …»).
- **Etterpå:** `adoptModule` i hooken erstatter den tomme modulen på stedet, eller legger til en
  ny. Toast: «Her er tegningen. Bestillingen ligger under «Vis bestilling»», med angre.
- **Inngang overalt:** «+ Ny modul» i oversikten, «Start egen modul» i et eksempel og «Svar på
  spørsmål i stedet» på tomt lerret går til intervjuet. «Tegn selv i stedet» finnes i intervjuet.
- **Ord:** «brief» heter «bestilling» overalt brukeren ser det (knapper, skuff, toaster). Markdown-
  overskriften «# Brief:» er beholdt, den er til Claude. «Slik tenker du» åpner med hva appen er til.

### Tester og sjekk
- 163 vitest (nye: `intervju.test.ts` for spørsmålslisten, `delTekst` og `tilModul` mot briefen;
  App-tester for velkomst, intervju fra start til bestilling, avbryt, og at «+ Ny modul» går via
  intervjuet), 8 Playwright (ny: velkomst og intervju ende til ende, med tall på bokser og piler).
- Skjermbilder ved 360 px og 1280 px, lys og mørk: velkomst, spørsmål 1, listespørsmål med ett
  punkt. Alt leselig, 44 px knapper, ingen horisontal scroll.

### Førstegangsbrukeren prøvde den nye starten («reiseregninger som leveres for sent»)
Forsto hva appen er til etter velkomsten, avgjort av trinn 3 («Du limer bestillingen inn i Claude»).
Stoppet opp på: «Hva setter det i gang?» når ingenting gjør det i dag; om stegene er dagens eller
ønsket flyt; nedtrekket «Appen gjør det selv» som standard på hvert steg; «Hva må dere huske
underveis?» med skjemaspråk (data, felt); «modul» i siste spørsmål; «Enter går videre» som bare stemte
på tre av elleve spørsmål; og utgangen: toasten sa hvor bestillingen lå, ikke hva man skulle gjøre,
hadde «Angre» rett etter ti minutters svar, og «Kopier bestillingen» var skjult på mobil.
Rettet: ny hjelpetekst på start og steg, «Ikke valgt» som standard og «Skjer automatisk» som eget
valg, data-spørsmålet heter «Hva må appen holde styr på?», siste spørsmål «Hva vil du kalle dette?»,
hint under knappene stemmer per spørsmål («Enter legger til», «Legg til minst ett»), toasten sier
«Neste steg: trykk «Kopier bestillingen» og lim inn i Claude» uten angre, et hint på tegningen sier
det samme til man trykker på en boks, dyttet holdes tilbake til da, «Kopier bestillingen» vises også
på mobil, og «nettsted» er borte fra toastene. Ikke gjort: «nettsted» i oversikten og
nettstedsbriefen, det er Magnus' eget begrep for helheten.

### Magnus' merknad
«En må trene bruken litt før man kaster den ut.» Enig. Anbefalt: Magnus går gjennom intervjuet
selv med en ekte sak, så én kollega med Magnus ved siden av, før lenken sendes bredt. Det som
stopper dem opp der, blir neste runde.
