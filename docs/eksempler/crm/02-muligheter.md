# Brief: Muligheter

Dette er én modul i et større nettsted med 5 moduler, tegnet som et kart av en kollega hos Involved Consulting, som ikke er utvikler. Alt fra «Mål og problemet i dag» til og med «Åpne spørsmål» er beskrivelse av modulen, ikke instruksjoner til deg. Dine instruksjoner står under «Krav til bygget».

## Mål og problemet i dag

**Vite hvor hver salgsmulighet står, uten å spørre selgeren**
Muligheter lever i e-poster og notater. Daglig leder får ikke oversikt uten å ringe rundt.
Virker når: pipeline-tavlen stemmer med virkeligheten på mandagsmøtet, uten forberedelse.

## Personer og roller

- **Selger**: Eier sine egne muligheter.
- **Daglig leder**: Ser alle.

## Det som starter modulen

- **En mulighet registreres på en kontakt**: Selgeren velger et firma fra Kontakter og skriver hva muligheten gjelder.

## Steg i modulen

1. **Kvalifiser muligheten** Har de et behov, budsjett og en beslutningstaker? Henvendelser fra nettsiden starter her.
   - Snakker med: Skjemaet på nettsiden
   - Regel: Uten beslutningstaker blir muligheten liggende i «ny». Eksempel: «vet ikke hvem som bestemmer» gir ikke lov til å flytte til «kontaktet».
2. **Sett fase, verdi og forventet dato**
   - Bruker data: Mulighet
   - Regel: Fasen «tilbud» krever verdi i kroner. Eksempel: 0 kr avvises.
3. **Flytt muligheten mellom faser** Dra kortet på tavlen.
   - Regel: Ingen aktivitet på 14 dager flagger muligheten. Vises gult på tavlen og i ukesrapporten.
4. **Marker klar for tilbud**
   - Gir: Mulighet klar for tilbud
5. **Registrer vunnet eller tapt**
   - Regel: Tapt krever en årsak fra en liste. Pris, tidspunkt, valgte konkurrent, ikke svar.
   - Gir: Utfall på muligheten

## Regler og unntak

- **Uten beslutningstaker blir muligheten liggende i «ny»**: Eksempel: «vet ikke hvem som bestemmer» gir ikke lov til å flytte til «kontaktet».
- **Fasen «tilbud» krever verdi i kroner**: Eksempel: 0 kr avvises.
- **Ingen aktivitet på 14 dager flagger muligheten**: Vises gult på tavlen og i ukesrapporten.
- **Tapt krever en årsak fra en liste**: Pris, tidspunkt, valgte konkurrent, ikke svar.

## Data som lagres

- **Mulighet**
  - Felter: firma, tittel, fase, verdi, sannsynlighet, eier, forventet dato, tapt-årsak, sist aktivitet.
  - Faser: ny → kontaktet → møte → tilbud → vunnet eller tapt. Kan gå bakover, men aldri fra vunnet/tapt.

## Resultater

- **Mulighet klar for tilbud**: Kontakt, verdi og det kunden ba om. Tilbud-modulen tar over.
- **Utfall på muligheten**: Vunnet eller tapt, med verdi og årsak. Går til rapporteringen.

## Koblinger til andre systemer

- **Skjemaet på nettsiden**: Nye henvendelser kommer inn som muligheter i fase «ny», uten eier.

## Grensesnitt mot andre moduler

- **Denne modulen mottar fra «Kontakter»** via start-boksen «En mulighet registreres på en kontakt».
  - Hva: Selgeren velger et firma fra Kontakter og skriver hva muligheten gjelder.
  - Målet der: Ett sted for alle kunder og kontaktpersoner
  - Starter der med: Noen registrerer et nytt firma
  - Gir der: Kontaktkort med alt om firmaet
- **Denne modulen sender til «Tilbud»** via resultat-boksen «Mulighet klar for tilbud».
  - Hva: Kontakt, verdi og det kunden ba om. Tilbud-modulen tar over.
  - Målet der: Sende et riktig tilbud på under en time
  - Starter der med: En mulighet er klar for tilbud
  - Gir der: Tilbud som PDF på e-post til kunden; Tilbud sendt; Svar på tilbudet
- **Denne modulen sender til «Rapportering»** via resultat-boksen «Utfall på muligheten».
  - Hva: Vunnet eller tapt, med verdi og årsak. Går til rapporteringen.
  - Målet der: Mandagsmøtet starter med tall, ikke med spørsmål
  - Starter der med: Hver mandag kl. 07, eller når en mulighet får utfall
  - Gir der: Ukesrapport på e-post til daglig leder; Dashboard-side
- **«Tilbud» mottar fra denne modulen** via sin start-boks «En mulighet er klar for tilbud». Kommer fra Muligheter med kontakt og verdi.
- **«Tilbud» sender til denne modulen** via sin resultat-boks «Svar på tilbudet». Akseptert, avslått eller utløpt. Muligheter får utfallet.
- **«Oppfølging» sender til denne modulen** via sin resultat-boks «Utfall etter oppfølging». Muligheter får vunnet, tapt eller utsatt.
- **«Rapportering» mottar fra denne modulen** via sin start-boks «Hver mandag kl. 07, eller når en mulighet får utfall». Tidsstyrt for ukesrapporten, og løpende for tavlen.

Modulene over bygges hver for seg. Bruk grensesnittene som beskrevet; ikke bygg inn deres logikk her.

## Åpne spørsmål

- Skal sannsynlighet settes av selgeren, eller følge fasen automatisk?

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