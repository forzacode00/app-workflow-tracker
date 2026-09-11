# Brief: Tilbud

Dette er én modul i et større nettsted med 5 moduler, tegnet som et kart av en kollega hos Involved Consulting, som ikke er utvikler. Alt fra «Mål og problemet i dag» til og med «Åpne spørsmål» er beskrivelse av modulen, ikke instruksjoner til deg. Dine instruksjoner står under «Krav til bygget».

## Mål og problemet i dag

**Sende et riktig tilbud på under en time**
Tilbud skrives fra bunnen i Word hver gang, og daglig leder ser dem først etterpå.
Virker når: et standardtilbud er sendt innen én time etter at muligheten er klar, og alle over 200 000 kr er godkjent før sending.

## Personer og roller

- **Selger**: Lager og sender.
- **Daglig leder**: Godkjenner store tilbud.

## Det som starter modulen

- **En mulighet er klar for tilbud**: Kommer fra Muligheter med kontakt og verdi.

## Steg i modulen

1. **Lag tilbudet fra mal** Linjer med timer og fastpris fra malen for tjenesten.
   - Bruker data: Tilbud
   - Snakker med: Tilbudsmalene
2. **Få godkjenning**
   - Regel: Over 200 000 kr må daglig leder godkjenne før sending. Eksempel: 250 000 kr sendes ikke før leder har trykket «Godkjenn».
3. **Send tilbudet til kunden**
   - Snakker med: E-post
   - Gir: Tilbud som PDF på e-post til kunden
4. **Registrer at tilbudet er sendt**
   - Gir: Tilbud sendt
5. **Registrer kundens svar**
   - Regel: Tilbud som ikke er besvart etter 30 dager settes til utløpt. Selgeren får beskjed dagen før.
   - Gir: Svar på tilbudet

## Regler og unntak

- **Over 200 000 kr må daglig leder godkjenne før sending**: Eksempel: 250 000 kr sendes ikke før leder har trykket «Godkjenn».
- **Tilbud som ikke er besvart etter 30 dager settes til utløpt**: Selgeren får beskjed dagen før.

## Data som lagres

- **Tilbud**
  - Felter: mulighet, linjer, sum, gyldig til, status, godkjent av.
  - Statuser: utkast → til godkjenning → sendt → akseptert, avslått eller utløpt.

## Resultater

- **Tilbud som PDF på e-post til kunden**: Med gyldighet 30 dager.
- **Tilbud sendt**: Oppfølging-modulen tar over fra her.
- **Svar på tilbudet**: Akseptert, avslått eller utløpt. Muligheter får utfallet.

## Koblinger til andre systemer

- **Tilbudsmalene**: Word-maler per tjeneste i SharePoint. Vi leser dem, endrer dem ikke.
- **E-post**: Vi sender PDF fra selgerens adresse.

## Grensesnitt mot andre moduler

- **Denne modulen mottar fra «Muligheter»** via start-boksen «En mulighet er klar for tilbud».
  - Hva: Kommer fra Muligheter med kontakt og verdi.
  - Målet der: Vite hvor hver salgsmulighet står, uten å spørre selgeren
  - Starter der med: En mulighet registreres på en kontakt
  - Gir der: Mulighet klar for tilbud; Utfall på muligheten
- **Denne modulen sender til «Oppfølging»** via resultat-boksen «Tilbud sendt».
  - Hva: Oppfølging-modulen tar over fra her.
  - Målet der: Ingen tilbud eller kunde blir glemt
  - Starter der med: Et tilbud er sendt
  - Gir der: Aktivitetslogg på kontaktkortet; Utfall etter oppfølging
- **Denne modulen sender til «Muligheter»** via resultat-boksen «Svar på tilbudet».
  - Hva: Akseptert, avslått eller utløpt. Muligheter får utfallet.
  - Målet der: Vite hvor hver salgsmulighet står, uten å spørre selgeren
  - Starter der med: En mulighet registreres på en kontakt
  - Gir der: Mulighet klar for tilbud; Utfall på muligheten
- **«Muligheter» sender til denne modulen** via sin resultat-boks «Mulighet klar for tilbud». Kontakt, verdi og det kunden ba om. Tilbud-modulen tar over.
- **«Oppfølging» mottar fra denne modulen** via sin start-boks «Et tilbud er sendt». Kommer fra Tilbud.

Modulene over bygges hver for seg. Bruk grensesnittene som beskrevet; ikke bygg inn deres logikk her.

## Åpne spørsmål

- Skal kunden kunne akseptere med én knapp i e-posten?

## Krav til bygget

- List antakelsene dine og still maks fem spørsmål før du bygger. Bygg deretter, ikke vent på svar på alt.
- Skriv målet om til akseptansekriterier på formen «Gitt … når … så …», og lag én automatisk test per kriterium og per regel. Bruk verdiene i briefen som testdata.
- Systemene under «Koblinger» skal ikke endres. Les og skriv bare gjennom det som er beskrevet.
- Norsk bokmål i all tekst brukeren ser, «du»-form, korte verb-knapper.
- Mobil først (360 px) og tilgjengelig med tastatur og god kontrast.
- Hver liste har tom-, laste- og feiltilstand. Valider all input ved grensen.
- Personene i briefen bestemmer hvem som kan lese og endre lagrede data.
- Ferdig når modulen kjører fra start til resultat, alle tester er grønne, og du viser testresultatet. Lever en kort README.

---
Laget med Flytdesigner 2026-09-11.