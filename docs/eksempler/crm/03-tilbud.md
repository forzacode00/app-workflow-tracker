# Brief: Tilbud

Dette er én modul i et større nettsted med 5 moduler, tegnet som et kart av en kollega hos Involved Consulting, som ikke er utvikler. Alt fra «Mål og problemet i dag» til og med «Åpne spørsmål» er beskrivelse av modulen, ikke instruksjoner til deg. Dine instruksjoner står under «Krav til bygget».

## Mål og problemet i dag

**Sende et riktig tilbud på under en time**
Tilbud skrives fra bunnen i Word hver gang, og daglig leder ser dem først etterpå.
Virker når: et standardtilbud er sendt innen én time etter at muligheten er klar, og alle over 200 000 kr er godkjent før sending.

## Personer og roller

- **Selger**: Lager og sender egne tilbud, ser alle.
- **Daglig leder**: Godkjenner store tilbud.
- **Kunde**: Ekstern, uten innlogging. Får tilbudet som PDF på e-post.

## Det som starter modulen

- **En mulighet er i fase tilbud**: Kommer fra Muligheter med mulighet-id, firma, kontaktperson, verdi, hva kunden ba om og tjeneste.

## Steg i modulen

1. **Selger lager tilbudet fra mal** Malen for tjenesten gir linjene. Én linje er beskrivelse, timer og timepris, eller en fastpris. Sum er uten mva.
   - Bruker data: Tilbud
   - Bruker data: Tilbudslinje
   - Snakker med: Tilbudsmalene
2. **Daglig leder godkjenner**
   - Bruker data: Tilbud
   - Regel: Over 200 000 kr må daglig leder godkjenne før sending. Eksempel: 250 000 kr sendes ikke før leder har trykket «Godkjenn». 200 000 kr trenger ikke, og går rett fra utkast til sendt. Avslår leder, går tilbudet tilbake til utkast med kommentar.
3. **Selger sender tilbudet til kunden** PDF fra malen, sendt til valgt kontaktperson. Status blir «sendt» med dato.
   - Bruker data: Tilbud
   - Snakker med: E-post
   - Gir: Tilbud som PDF på e-post til kunden
4. **Appen melder at tilbudet er sendt**
   - Gir: Tilbud sendt
5. **Selger registrerer kundens svar**
   - Regel: Ubesvart tilbud settes til utløpt dagen etter gyldig til. Selgeren får beskjed dagen før. Utløpt regnes som tapt med årsak «ikke svar». Nytt tilbud på samme mulighet er lov, det gamle blir «erstattet».
   - Gir: Svar på tilbudet

## Regler og unntak

Alle regler står under steget de hører til.

## Data som lagres

- **Tilbud**
  - Felter: mulighet, firma, sendt til (kontaktperson), eier, linjer, sum uten mva, gyldig til, sendt dato, status, godkjent av, kommentar fra leder.
  - Statuser: utkast → til godkjenning → godkjent → sendt → akseptert, avslått, utløpt eller erstattet. Til godkjenning → utkast når leder avslår.
  - Brukes i steg: Selger lager tilbudet fra mal; Daglig leder godkjenner; Selger sender tilbudet til kunden
- **Tilbudslinje**: Felter: tilbud, beskrivelse, timer, timepris, fastpris, sum. Enten timer × timepris eller fastpris, ikke begge.
  - Brukes i steg: Selger lager tilbudet fra mal

## Resultater

- **Tilbud som PDF på e-post til kunden**: Gyldig 30 dager fra sendt dato.
  - Til: Kunde
- **Tilbud sendt**: Felter som sendes: tilbud-id, mulighet-id, firma, kontaktperson, selger, sendt dato, gyldig til.
- **Svar på tilbudet**: Felter som sendes: tilbud-id, mulighet-id, svar (akseptert, avslått, utløpt, erstattet), årsak ved avslått (pris, tidspunkt, valgte konkurrent), dato.

## Koblinger til andre systemer

- **Tilbudsmalene**: Word-maler per tjeneste i SharePoint. Vi leser dem for å hente linjer og tekst; vi endrer dem ikke.
- **E-post**: PDF sendes fra en felles avsender med selgeren som svar-til, så vi slipper tilgang til hver selgers postkasse.

## Grensesnitt mot andre moduler

- **Mottar fra «Muligheter»**
  - «En mulighet er i fase tilbud» (start her). Kommer fra Muligheter med mulighet-id, firma, kontaktperson, verdi, hva kunden ba om og tjeneste.
  - «Mulighet i fase tilbud» (resultat i «Muligheter»). Felter som sendes: mulighet-id, firma, kontaktperson, verdi, hva kunden ba om, tjeneste. Data «Mulighet»: Felter: firma, kontaktperson, beslutningstaker (kontaktperson), tittel, hva kunden ba om, tjeneste, fase, verdi, sannsynlighet, eier, forventet dato, utfall, tapt-årsak, sist aktivitet. Faser: ny → kontaktet → møte → tilbud → vunnet eller tapt. Kan gå bakover, men aldri fra vunnet eller tapt.
  - Målet i «Muligheter»: Vite hvor hver salgsmulighet står, uten å spørre selgeren
- **Sender til «Aktiviteter»**
  - «Tilbud sendt» (resultat her). Felter som sendes: tilbud-id, mulighet-id, firma, kontaktperson, selger, sendt dato, gyldig til. Data «Tilbud», se «Data som lagres».
  - Målet i «Aktiviteter»: Ingen kunde eller tilbud blir glemt
- **Sender til «Muligheter»**
  - «Svar på tilbudet» (resultat her). Felter som sendes: tilbud-id, mulighet-id, svar (akseptert, avslått, utløpt, erstattet), årsak ved avslått (pris, tidspunkt, valgte konkurrent), dato. Data «Tilbud», se «Data som lagres».

Hver kanal over er én kontrakt: samme feltnavn i begge moduler, den som sender eier feltene. Modulene bygges hver for seg; bruk kontrakten, ikke den andre modulens logikk.

## Åpne spørsmål

- Hvem godkjenner daglig leders egne tilbud over 200 000 kr?
- Kan PDF-en lages fra en mal i appen i stedet for Word-malene i SharePoint?

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