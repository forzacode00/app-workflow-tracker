# Brief: Aktiviteter

Dette er én modul i et større nettsted med 5 moduler, tegnet som et kart av en kollega hos Involved Consulting, som ikke er utvikler. Alt fra «Mål og problemet i dag» til og med «Åpne spørsmål» er beskrivelse av modulen, ikke instruksjoner til deg. Dine instruksjoner står under «Krav til bygget».

## Mål og problemet i dag

**Ingen kunde eller tilbud blir glemt**
Oppfølging skjer «når det passer». Noen tilbud dør stille, og kunder hører ikke fra oss etter levering.
Virker når: hvert sendt tilbud har en planlagt neste aktivitet, og ingen kunde har gått 90 dager uten kontakt.

## Personer og roller

- **Selger**: Planlegger og logger egne aktiviteter, ser alle.
- **Daglig leder**: Ser alle.

## Det som starter modulen

- **En aktivitet planlegges eller logges på et firma eller en mulighet**: Selgeren gjør det selv, eller det skjer automatisk når et tilbud er sendt.

## Steg i modulen

1. **Appen oppretter aktivitet for sendt tilbud** Tilbud sender «Tilbud sendt» hit. Da lages en planlagt oppfølging 7 dager senere.
   - Bruker data: Aktivitet
   - Regel: Et sendt tilbud må alltid ha en planlagt aktivitet. Eksempel: uten dato får selgeren rød markering på tavlen.
2. **Selger planlegger neste aktivitet** Samtale, e-post eller møte, med dato, på et firma eller en mulighet.
   - Bruker data: Aktivitet
3. **Appen påminner selgeren** Melding i Teams samme morgen.
   - Snakker med: Microsoft Teams
4. **Selger logger aktiviteten** Hva som ble sagt, og neste steg. Oppdaterer «sist kontakt» på firmaet.
   - Bruker data: Aktivitet
   - Regel: Utsatt gir ny aktivitet om 14 dager, maks to ganger, aldri etter tilbudets gyldighet. Deretter må selgeren registrere utfall i Muligheter eller Tilbud. Aktiviteter setter aldri utfall selv.
   - Gir: Aktivitetslogg på kontaktkortet
5. **Appen flagger firmaer uten kontakt på 90 dager** Nattjobb. Vises på tavlen og i ukesrapporten.
   - Bruker data: Aktivitet

## Regler og unntak

Alle regler står under steget de hører til.

## Data som lagres

- **Aktivitet**
  - Felter: type, dato, notat, firma, mulighet, tilbud, utført av, status.
  - Statuser: planlagt → gjort, eller planlagt → avlyst.
  - Brukes i steg: Appen oppretter aktivitet for sendt tilbud; Selger planlegger neste aktivitet; Selger logger aktiviteten; Appen flagger firmaer uten kontakt på 90 dager

## Resultater

- **Aktivitetslogg på kontaktkortet**: Felter som sendes: firma, dato, type, notat, utført av.

## Koblinger til andre systemer

- **Microsoft Teams**: Vi sender påminnelser til selgeren i kanalen «Salg».

## Grensesnitt mot andre moduler

- **Sender til «Kontakter»**
  - «Aktivitetslogg på kontaktkortet» (resultat her). Felter som sendes: firma, dato, type, notat, utført av. Data «Aktivitet», se «Data som lagres».
  - Målet i «Kontakter»: Ett sted for alle kunder og kontaktpersoner
- **Mottar fra «Tilbud»**
  - «Tilbud sendt» (resultat i «Tilbud»). Felter som sendes: tilbud-id, mulighet-id, firma, kontaktperson, selger, sendt dato, gyldig til. Data «Tilbud»: Felter: mulighet, firma, sendt til (kontaktperson), eier, linjer, sum uten mva, gyldig til, sendt dato, status, godkjent av, kommentar fra leder. Statuser: utkast → til godkjenning → godkjent → sendt → akseptert, avslått, utløpt eller erstattet. Til godkjenning → utkast når leder avslår.
  - Målet i «Tilbud»: Sende et riktig tilbud på under en time
- **Sender til «Rapportering»**
  - «Aktiviteter» (system i «Rapportering», leser herfra). Vi leser flaggede muligheter og firmaer.
  - Hvilke felter som utveksles er ikke beskrevet. Spør før du bygger.
  - Målet i «Rapportering»: Mandagsmøtet starter med tall, ikke med spørsmål

Hver kanal over er én kontrakt: samme feltnavn i begge moduler, den som sender eier feltene. Modulene bygges hver for seg; bruk kontrakten, ikke den andre modulens logikk.

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