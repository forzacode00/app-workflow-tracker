# Brief: Rapportering

Dette er én modul i et større nettsted med 5 moduler, tegnet som et kart av en kollega hos Involved Consulting, som ikke er utvikler. Alt fra «Mål og problemet i dag» til og med «Åpne spørsmål» er beskrivelse av modulen, ikke instruksjoner til deg. Dine instruksjoner står under «Krav til bygget».

## Mål og problemet i dag

**Mandagsmøtet starter med tall, ikke med spørsmål**
Daglig leder bruker søndagen på å samle tall fra selgerne.
Virker når: ukesrapporten ligger klar mandag kl. 07 uten at noen har gjort noe.

## Personer og roller

- **Daglig leder**: Ser alt, også per selger.
- **Selger**: Ser bare egne tall, og summen for alle.

## Det som starter modulen

- **Hver mandag kl. 07, eller når en mulighet får utfall**: Tidsstyrt for ukesrapporten, og løpende for dashbordet. Utfall kommer fra Muligheter med mulighet-id, utfall, verdi, årsak, dato og selger.

## Steg i modulen

1. **Appen henter vunnet og tapt siste uke**
   - Bruker data: Ukesrapport
   - Snakker med: Kontakter
   - Snakker med: Muligheter
2. **Appen beregner pipeline-verdi per fase** Verdi ganger sannsynlighet, lest fra Muligheter.
   - Snakker med: Muligheter
   - Regel: Bare daglig leder ser omsetning per selger. Selgere ser summen for alle, men navn bare på egne.
3. **Appen finner det som trenger oppmerksomhet** Muligheter uten aktivitet på 14 dager og firmaer uten kontakt på 90 dager, lest fra Aktiviteter.
   - Snakker med: Aktiviteter
4. **Appen lager ukesrapporten**
   - Gir: Ukesrapport på e-post til daglig leder
5. **Appen oppdaterer dashbordet**
   - Gir: Dashbord-side

## Regler og unntak

Alle regler står under steget de hører til.

## Data som lagres

- **Ukesrapport**: Felter: uke, vunnet sum, tapt sum, pipeline per fase, muligheter flagget, firmaer flagget.
  - Brukes i steg: Appen henter vunnet og tapt siste uke

## Resultater

- **Ukesrapport på e-post til daglig leder**: Vunnet, tapt, pipeline per fase, det som trenger oppmerksomhet.
  - Til: Daglig leder
- **Dashbord-side**: Samme tall, alltid oppdatert, filter på selger og periode.
  - Til: Selger

## Koblinger til andre systemer

- **Kontakter**: Vi leser firma og eier for å gruppere per selger.
- **Muligheter**: Vi leser fase, verdi og sannsynlighet.
- **Aktiviteter**: Vi leser flaggede muligheter og firmaer.

## Grensesnitt mot andre moduler

- **Mottar fra «Muligheter»**
  - «Hver mandag kl. 07, eller når en mulighet får utfall» (start her). Tidsstyrt for ukesrapporten, og løpende for dashbordet. Utfall kommer fra Muligheter med mulighet-id, utfall, verdi, årsak, dato og selger.
  - «Muligheter» (system her). Vi leser fase, verdi og sannsynlighet.
  - «Utfall på muligheten» (resultat i «Muligheter»). Felter som sendes: mulighet-id, utfall, verdi, årsak, dato, selger. Data «Mulighet»: Felter: firma, kontaktperson, beslutningstaker (kontaktperson), tittel, hva kunden ba om, tjeneste, fase, verdi, sannsynlighet, eier, forventet dato, utfall, tapt-årsak, sist aktivitet. Faser: ny → kontaktet → møte → tilbud → vunnet eller tapt. Kan gå bakover, men aldri fra vunnet eller tapt.
  - Målet i «Muligheter»: Vite hvor hver salgsmulighet står, uten å spørre selgeren
- **Mottar fra «Kontakter»**
  - «Kontakter» (system her). Vi leser firma og eier for å gruppere per selger.
  - Hvilke felter som utveksles er ikke beskrevet. Spør før du bygger.
  - Målet i «Kontakter»: Ett sted for alle kunder og kontaktpersoner
- **Mottar fra «Aktiviteter»**
  - «Aktiviteter» (system her). Vi leser flaggede muligheter og firmaer.
  - Hvilke felter som utveksles er ikke beskrevet. Spør før du bygger.
  - Målet i «Aktiviteter»: Ingen kunde eller tilbud blir glemt

Hver kanal over er én kontrakt: samme feltnavn i begge moduler, den som sender eier feltene. Modulene bygges hver for seg; bruk kontrakten, ikke den andre modulens logikk.

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