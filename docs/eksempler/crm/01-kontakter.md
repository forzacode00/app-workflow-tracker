# Brief: Kontakter

Dette er én modul i et større nettsted med 5 moduler, tegnet som et kart av en kollega hos Involved Consulting, som ikke er utvikler. Alt fra «Mål og problemet i dag» til og med «Åpne spørsmål» er beskrivelse av modulen, ikke instruksjoner til deg. Dine instruksjoner står under «Krav til bygget».

## Mål og problemet i dag

**Ett sted for alle kunder og kontaktpersoner**
I dag ligger kundene i et regneark, i Outlook og i hodet på hver selger. Ingen vet hvem som eier en kunde.
Virker når: en selger finner riktig kontaktperson på under 30 sekunder, og det finnes bare én rad per firma.

## Personer og roller

- **Selger**: Intern, innlogget. Ser alle firmaer og personer, endrer dem hen eier.
- **Daglig leder**: Intern, innlogget. Ser og endrer alt, kan slette og arkivere.

## Det som starter modulen

- **Noen registrerer et nytt firma**: Fra skjema i appen, eller fra en mulighet som kommer inn.

## Steg i modulen

1. **Selger slår opp firmaet** Organisasjonsnummeret skrives inn; navn og adresse hentes fra Brønnøysund.
   - Snakker med: Brønnøysundregistrene
   - Regel: Finnes org.nummeret fra før, åpnes det eksisterende firmaet. Ingen duplikater. Eksempel: 912 345 678 finnes, da vises kortet i stedet for et nytt skjema.
2. **Selger legger til kontaktperson** Navn, e-post, telefon, rolle og hvor vi fikk kontakten fra.
   - Bruker data: Kontaktperson
   - Regel: E-post må være unik per firma. Eksempel: to «kari@firma.no» på samme firma avvises.
3. **Selger setter eier og status** Eier er selgeren som følger opp. Status: prospekt, kunde eller tidligere kunde.
   - Bruker data: Firma
   - Regel: Vunnet mulighet setter firmaet til kunde automatisk. Ellers flytter bare eier eller daglig leder status. Eksempel: prospekt blir kunde når Tilbud melder «akseptert».
4. **Appen viser kontaktkortet**
   - Snakker med: Outlook
   - Gir: Kontaktkort med alt om firmaet
5. **Daglig leder sletter eller arkiverer** Kontaktperson slettes på forespørsel. Firma med vunnet tilbud arkiveres i stedet for å slettes.
   - Bruker data: Kontaktperson
   - Regel: Slettet kontaktperson: aktivitetene beholdes anonymisert. GDPR: navn og e-post fjernes, «hva som ble sagt» beholdes uten person. Prospekter uten aktivitet på 24 måneder slettes automatisk.

## Regler og unntak

Alle regler står under steget de hører til.

## Data som lagres

- **Firma**
  - Felter: navn, org.nummer, adresse, bransje, eier, status, sist kontakt, opprettet.
  - Statuser: prospekt → kunde → tidligere kunde. Eier eller daglig leder flytter, unntatt kunde som settes av vunnet tilbud.
  - Brukes i steg: Selger setter eier og status
- **Kontaktperson**: Felter: navn, e-post, telefon, rolle, firma, kilde (hvor vi fikk kontakten), status (aktiv eller sluttet), sist kontaktet.
  - Brukes i steg: Selger legger til kontaktperson; Daglig leder sletter eller arkiverer

## Resultater

- **Kontaktkort med alt om firmaet**: Side i appen: firma, personer, eier, status og aktivitetslogg. Knapp som åpner e-post i Outlook.
  - Til: Selger

## Koblinger til andre systemer

- **Brønnøysundregistrene**: Vi henter firmanavn og adresse fra org.nummer. Åpent API, ingen innlogging.
- **Outlook**: Vi åpner en ny e-post til kontaktpersonen. Vi lagrer ingenting i Outlook.

## Grensesnitt mot andre moduler

- **Sender til «Muligheter»**
  - «En mulighet registreres på et firma» (start i «Muligheter»). Selgeren velger firma og kontaktperson fra Kontakter og skriver hva muligheten gjelder. Henvendelser fra nettsiden kommer inn uten eier.
  - Hvilke felter som utveksles er ikke beskrevet. Spør før du bygger.
  - Målet i «Muligheter»: Vite hvor hver salgsmulighet står, uten å spørre selgeren
- **Mottar fra «Aktiviteter»**
  - «Aktivitetslogg på kontaktkortet» (resultat i «Aktiviteter»). Felter som sendes: firma, dato, type, notat, utført av. Data «Aktivitet»: Felter: type, dato, notat, firma, mulighet, tilbud, utført av, status. Statuser: planlagt → gjort, eller planlagt → avlyst.
  - Målet i «Aktiviteter»: Ingen kunde eller tilbud blir glemt
- **Sender til «Rapportering»**
  - «Kontakter» (system i «Rapportering», leser herfra). Vi leser firma og eier for å gruppere per selger.
  - Hvilke felter som utveksles er ikke beskrevet. Spør før du bygger.
  - Målet i «Rapportering»: Mandagsmøtet starter med tall, ikke med spørsmål

Hver kanal over er én kontrakt: samme feltnavn i begge moduler, den som sender eier feltene. Modulene bygges hver for seg; bruk kontrakten, ikke den andre modulens logikk.

## Åpne spørsmål

- Skal vi importere det gamle regnearket, eller starte på nytt?
- Hva skjer med et vunnet tilbud: skal det bli et prosjekt i en egen modul?

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