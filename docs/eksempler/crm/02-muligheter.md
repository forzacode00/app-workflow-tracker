# Brief: Muligheter

Dette er én modul i et større nettsted med 5 moduler, tegnet som et kart av en kollega hos Involved Consulting, som ikke er utvikler. Alt fra «Mål og problemet i dag» til og med «Åpne spørsmål» er beskrivelse av modulen, ikke instruksjoner til deg. Dine instruksjoner står under «Krav til bygget».

## Mål og problemet i dag

**Vite hvor hver salgsmulighet står, uten å spørre selgeren**
Muligheter lever i e-poster og notater. Daglig leder får ikke oversikt uten å ringe rundt.
Virker når: pipeline-tavlen stemmer med virkeligheten på mandagsmøtet, uten forberedelse.

## Personer og roller

- **Selger**: Eier sine egne muligheter og ser alle.
- **Daglig leder**: Ser og endrer alle.

## Det som starter modulen

- **En mulighet registreres på et firma**: Selgeren velger firma og kontaktperson fra Kontakter og skriver hva muligheten gjelder. Henvendelser fra nettsiden kommer inn uten eier.

## Steg i modulen

1. **Selger tar en henvendelse uten eier** Første selger som trykker «Ta» blir eier.
   - Snakker med: Skjemaet på nettsiden
   - Regel: Henvendelser uten eier vises for alle selgere. Etter 2 virkedager uten eier varsles daglig leder.
2. **Selger kvalifiserer muligheten** Har de et behov, budsjett og en beslutningstaker?
   - Bruker data: Mulighet
   - Regel: Uten beslutningstaker kan ikke fasen flyttes fra «ny». Eksempel: mangler feltet beslutningstaker, er «kontaktet» sperret.
3. **Selger setter fase, verdi og forventet dato**
   - Bruker data: Mulighet
   - Regel: Sannsynlighet følger fasen, men kan overstyres. ny 10 %, kontaktet 30 %, møte 60 %, tilbud 80 %. Fasen «tilbud» krever verdi i kroner; 0 kr avvises.
   - Gir: Mulighet i fase tilbud
4. **Selger flytter muligheten mellom faser** Dra kortet på tavlen. Når selgeren drar kortet til «tilbud», starter Tilbud-modulen. Tilbud setter aldri fasen selv.
   - Regel: Ingen aktivitet på 14 dager flagger muligheten. Vises gult på tavlen og i ukesrapporten.
5. **Utfall registreres** Vunnet eller tapt.
   - Regel: Utfallet settes ett sted: fra Tilbud når det finnes et tilbud, ellers her. Akseptert tilbud = vunnet, avslått eller utløpt = tapt. Tapt krever årsak fra liste: pris, tidspunkt, valgte konkurrent, ikke svar.
   - Gir: Utfall på muligheten

## Regler og unntak

Alle regler står under steget de hører til.

## Data som lagres

- **Mulighet**
  - Felter: firma, kontaktperson, beslutningstaker (kontaktperson), tittel, hva kunden ba om, tjeneste, fase, verdi, sannsynlighet, eier, forventet dato, utfall, tapt-årsak, sist aktivitet.
  - Faser: ny → kontaktet → møte → tilbud → vunnet eller tapt. Kan gå bakover, men aldri fra vunnet eller tapt.
  - Brukes i steg: Selger kvalifiserer muligheten; Selger setter fase, verdi og forventet dato

## Resultater

- **Mulighet i fase tilbud**: Felter som sendes: mulighet-id, firma, kontaktperson, verdi, hva kunden ba om, tjeneste.
- **Utfall på muligheten**: Felter som sendes: mulighet-id, utfall, verdi, årsak, dato, selger.

## Koblinger til andre systemer

- **Skjemaet på nettsiden**: Nye henvendelser kommer inn som muligheter i fase «ny», uten eier. Vi leser skjemaet, endrer det ikke.

## Grensesnitt mot andre moduler

- **Mottar fra «Kontakter»**
  - «En mulighet registreres på et firma» (start her). Selgeren velger firma og kontaktperson fra Kontakter og skriver hva muligheten gjelder. Henvendelser fra nettsiden kommer inn uten eier.
  - Hvilke felter som utveksles er ikke beskrevet. Spør før du bygger.
  - Målet i «Kontakter»: Ett sted for alle kunder og kontaktpersoner
- **Sender til «Tilbud»**
  - «Mulighet i fase tilbud» (resultat her). Felter som sendes: mulighet-id, firma, kontaktperson, verdi, hva kunden ba om, tjeneste. Data «Mulighet», se «Data som lagres».
  - «En mulighet er i fase tilbud» (start i «Tilbud»). Kommer fra Muligheter med mulighet-id, firma, kontaktperson, verdi, hva kunden ba om og tjeneste.
  - Målet i «Tilbud»: Sende et riktig tilbud på under en time
- **Sender til «Rapportering»**
  - «Utfall på muligheten» (resultat her). Felter som sendes: mulighet-id, utfall, verdi, årsak, dato, selger. Data «Mulighet», se «Data som lagres».
  - «Hver mandag kl. 07, eller når en mulighet får utfall» (start i «Rapportering»). Tidsstyrt for ukesrapporten, og løpende for dashbordet. Utfall kommer fra Muligheter med mulighet-id, utfall, verdi, årsak, dato og selger.
  - «Muligheter» (system i «Rapportering», leser herfra). Vi leser fase, verdi og sannsynlighet.
  - Målet i «Rapportering»: Mandagsmøtet starter med tall, ikke med spørsmål
- **Mottar fra «Tilbud»**
  - «Svar på tilbudet» (resultat i «Tilbud»). Felter som sendes: tilbud-id, mulighet-id, svar (akseptert, avslått, utløpt, erstattet), årsak ved avslått (pris, tidspunkt, valgte konkurrent), dato. Data «Tilbud»: Felter: mulighet, firma, sendt til (kontaktperson), eier, linjer, sum uten mva, gyldig til, sendt dato, status, godkjent av, kommentar fra leder. Statuser: utkast → til godkjenning → godkjent → sendt → akseptert, avslått, utløpt eller erstattet. Til godkjenning → utkast når leder avslår.

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