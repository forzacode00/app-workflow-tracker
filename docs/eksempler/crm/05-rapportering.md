# Brief: Rapportering

Dette er én modul i et større nettsted med 5 moduler, tegnet som et kart av en kollega hos Involved Consulting, som ikke er utvikler. Alt fra «Mål og problemet i dag» til og med «Åpne spørsmål» er beskrivelse av modulen, ikke instruksjoner til deg. Dine instruksjoner står under «Krav til bygget».

## Mål og problemet i dag

**Mandagsmøtet starter med tall, ikke med spørsmål**
Daglig leder bruker søndagen på å samle tall fra selgerne.
Virker når: ukesrapporten ligger klar mandag kl. 07 uten at noen har gjort noe.

## Personer og roller

- **Daglig leder**: Ser alt, også per selger.
- **Selger**: Ser bare egne tall.

## Det som starter modulen

- **Hver mandag kl. 07, eller når en mulighet får utfall**: Tidsstyrt for ukesrapporten, og løpende for tavlen.

## Steg i modulen

1. **Hent vunnet og tapt siste uke**
   - Bruker data: Ukesrapport
   - Snakker med: Kontakter
2. **Beregn pipeline-verdi per fase** Verdi ganger sannsynlighet.
   - Regel: Bare daglig leder ser omsetning per selger. Selgere ser summen for alle, men navn bare på egne.
3. **Lag ukesrapporten**
   - Gir: Ukesrapport på e-post til daglig leder
4. **Oppdater dashboardet**
   - Gir: Dashboard-side

## Regler og unntak

- **Bare daglig leder ser omsetning per selger**: Selgere ser summen for alle, men navn bare på egne.

## Data som lagres

- **Ukesrapport**: Felter: uke, vunnet sum, tapt sum, pipeline per fase, muligheter flagget.

## Resultater

- **Ukesrapport på e-post til daglig leder**: Vunnet, tapt, pipeline per fase, muligheter uten aktivitet.
- **Dashboard-side**: Samme tall, alltid oppdatert, filter på selger og periode.

## Koblinger til andre systemer

- **Kontakter**: Vi leser firma og eier derfra for å gruppere per selger.

## Grensesnitt mot andre moduler

- **Denne modulen mottar fra «Muligheter»** via start-boksen «Hver mandag kl. 07, eller når en mulighet får utfall».
  - Hva: Tidsstyrt for ukesrapporten, og løpende for tavlen.
  - Målet der: Vite hvor hver salgsmulighet står, uten å spørre selgeren
  - Starter der med: En mulighet registreres på en kontakt
  - Gir der: Mulighet klar for tilbud; Utfall på muligheten
- **Denne modulen sender til «Kontakter»** via system-boksen «Kontakter».
  - Hva: Vi leser firma og eier derfra for å gruppere per selger.
  - Målet der: Ett sted for alle kunder og kontaktpersoner
  - Starter der med: Noen registrerer et nytt firma
  - Gir der: Kontaktkort med alt om firmaet
- **«Muligheter» sender til denne modulen** via sin resultat-boks «Utfall på muligheten». Vunnet eller tapt, med verdi og årsak. Går til rapporteringen.

Modulene over bygges hver for seg. Bruk grensesnittene som beskrevet; ikke bygg inn deres logikk her.

## Åpne spørsmål

- Skal rapporten også gå til styret én gang i måneden?

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