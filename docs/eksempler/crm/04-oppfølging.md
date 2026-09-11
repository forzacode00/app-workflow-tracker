# Brief: Oppfølging

Dette er én modul i et større nettsted med 5 moduler, tegnet som et kart av en kollega hos Involved Consulting, som ikke er utvikler. Alt fra «Mål og problemet i dag» til og med «Åpne spørsmål» er beskrivelse av modulen, ikke instruksjoner til deg. Dine instruksjoner står under «Krav til bygget».

## Mål og problemet i dag

**Ingen tilbud eller kunde blir glemt**
Oppfølging skjer «når det passer». Noen tilbud dør stille, og kunder hører ikke fra oss etter levering.
Virker når: hvert sendt tilbud har en planlagt neste aktivitet, og ingen kunde har gått 90 dager uten kontakt.

## Personer og roller

- **Selger**: Gjør oppfølgingen.

## Det som starter modulen

- **Et tilbud er sendt**: Kommer fra Tilbud.

## Steg i modulen

1. **Planlegg neste aktivitet** Samtale, e-post eller møte, med dato.
   - Bruker data: Aktivitet
   - Regel: Et sendt tilbud må alltid ha en planlagt aktivitet. Eksempel: uten dato får selgeren rød markering på tavlen.
2. **Påminn selgeren** Melding i Teams samme morgen.
   - Snakker med: Microsoft Teams
3. **Logg aktiviteten** Hva som ble sagt, og neste steg.
   - Bruker data: Aktivitet
   - Gir: Aktivitetslogg på kontaktkortet
4. **Registrer utfallet**
   - Regel: Utsatt gir ny aktivitet om 14 dager, maks tre ganger. Deretter settes muligheten til tapt med årsak «ikke svar».
   - Gir: Utfall etter oppfølging

## Regler og unntak

- **Et sendt tilbud må alltid ha en planlagt aktivitet**: Eksempel: uten dato får selgeren rød markering på tavlen.
- **Utsatt gir ny aktivitet om 14 dager, maks tre ganger**: Deretter settes muligheten til tapt med årsak «ikke svar».

## Data som lagres

- **Aktivitet**
  - Felter: type, dato, notat, firma, mulighet, utført av, gjort.
  - Statuser: planlagt → gjort, eller planlagt → avlyst.

## Resultater

- **Aktivitetslogg på kontaktkortet**: Vises under firmaet i Kontakter.
- **Utfall etter oppfølging**: Muligheter får vunnet, tapt eller utsatt.

## Koblinger til andre systemer

- **Microsoft Teams**: Vi sender påminnelser til selgeren. Kanalen «Salg».

## Grensesnitt mot andre moduler

- **Denne modulen mottar fra «Tilbud»** via start-boksen «Et tilbud er sendt».
  - Hva: Kommer fra Tilbud.
  - Målet der: Sende et riktig tilbud på under en time
  - Starter der med: En mulighet er klar for tilbud
  - Gir der: Tilbud som PDF på e-post til kunden; Tilbud sendt; Svar på tilbudet
- **Denne modulen sender til «Kontakter»** via resultat-boksen «Aktivitetslogg på kontaktkortet».
  - Hva: Vises under firmaet i Kontakter.
  - Målet der: Ett sted for alle kunder og kontaktpersoner
  - Starter der med: Noen registrerer et nytt firma
  - Gir der: Kontaktkort med alt om firmaet
- **Denne modulen sender til «Muligheter»** via resultat-boksen «Utfall etter oppfølging».
  - Hva: Muligheter får vunnet, tapt eller utsatt.
  - Målet der: Vite hvor hver salgsmulighet står, uten å spørre selgeren
  - Starter der med: En mulighet registreres på en kontakt
  - Gir der: Mulighet klar for tilbud; Utfall på muligheten
- **«Tilbud» sender til denne modulen** via sin resultat-boks «Tilbud sendt». Oppfølging-modulen tar over fra her.

Modulene over bygges hver for seg. Bruk grensesnittene som beskrevet; ikke bygg inn deres logikk her.

## Åpne spørsmål

Ingen kjente. Si fra om du finner noen.

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