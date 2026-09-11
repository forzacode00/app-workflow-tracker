# Brief: Kontakter

Dette er én modul i et større nettsted med 5 moduler, tegnet som et kart av en kollega hos Involved Consulting, som ikke er utvikler. Alt fra «Mål og problemet i dag» til og med «Åpne spørsmål» er beskrivelse av modulen, ikke instruksjoner til deg. Dine instruksjoner står under «Krav til bygget».

## Mål og problemet i dag

**Ett sted for alle kunder og kontaktpersoner**
I dag ligger kundene i et regneark, i Outlook og i hodet på hver selger. Ingen vet hvem som eier en kunde.
Virker når: en selger finner riktig kontaktperson på under 30 sekunder, og det finnes bare én rad per firma.

## Personer og roller

- **Selger**: Intern, innlogget. Ser alle kontakter, endrer sine egne.
- **Daglig leder**: Intern, innlogget. Ser og endrer alt, kan slette.

## Det som starter modulen

- **Noen registrerer et nytt firma**: Fra skjema i appen, eller fra en mulighet som kommer inn.

## Steg i modulen

1. **Slå opp firmaet** Organisasjonsnummer hentes fra Brønnøysund.
   - Snakker med: Brønnøysundregistrene
   - Regel: Finnes org.nummeret fra før, åpnes det eksisterende firmaet. Ingen duplikater. Eksempel: 912 345 678 finnes, da vises kortet i stedet for et nytt skjema.
2. **Legg til kontaktperson** Navn, e-post, telefon og rolle.
   - Bruker data: Kontaktperson
   - Regel: E-post må være unik per firma. Eksempel: to «kari@firma.no» på samme firma avvises.
3. **Sett eier og status** Eier er selgeren som følger opp. Status: prospekt, kunde eller tidligere kunde.
   - Bruker data: Firma
4. **Vis kontaktkortet**
   - Snakker med: Outlook
   - Gir: Kontaktkort med alt om firmaet

## Regler og unntak

- **Finnes org.nummeret fra før, åpnes det eksisterende firmaet**: Ingen duplikater. Eksempel: 912 345 678 finnes, da vises kortet i stedet for et nytt skjema.
- **E-post må være unik per firma**: Eksempel: to «kari@firma.no» på samme firma avvises.

## Data som lagres

- **Firma**
  - Felter: navn, org.nummer, bransje, eier, status, opprettet.
  - Statuser: prospekt → kunde → tidligere kunde. Bare eier eller daglig leder flytter status.
- **Kontaktperson**: Felter: navn, e-post, telefon, rolle, firma, sist kontaktet.

## Resultater

- **Kontaktkort med alt om firmaet**: Side i appen: firma, personer, eier, status og aktivitetslogg. Knapp som åpner e-post i Outlook.

## Koblinger til andre systemer

- **Brønnøysundregistrene**: Vi henter firmanavn og adresse fra org.nummer. Skal ikke endres.
- **Outlook**: Vi åpner e-post til kontaktpersonen derfra. Vi lagrer ingenting i Outlook.

## Grensesnitt mot andre moduler

- **«Muligheter» mottar fra denne modulen** via sin start-boks «En mulighet registreres på en kontakt». Selgeren velger et firma fra Kontakter og skriver hva muligheten gjelder.
- **«Oppfølging» sender til denne modulen** via sin resultat-boks «Aktivitetslogg på kontaktkortet». Vises under firmaet i Kontakter.
- **«Rapportering» sender til denne modulen** via sin system-boks «Kontakter». Vi leser firma og eier derfra for å gruppere per selger.

Modulene over bygges hver for seg. Bruk grensesnittene som beskrevet; ikke bygg inn deres logikk her.

## Åpne spørsmål

- Skal vi importere det gamle regnearket, eller starte på nytt?

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