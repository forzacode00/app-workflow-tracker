# Flytdesigner: konsept og veikart

Skrevet 2026-09-11.

## Problemet

Involved Consulting har ingen utviklere eller designere. Kollegene vet hva de trenger, men når de
beskriver det for Claude blir resultatet feil, fordi beskrivelsen mangler det en utvikler ville
spurt om: trigger, felttyper, hvem som eier dataene, reglene, hva som er utenfor scope, og hvordan
den nye tingen henger sammen med det vi allerede har laget.

## Løsningen

Et skjema som tvinger fram en komplett beskrivelse, og som produserer en brief Claude bygger fra.
Verktøyet er rent arbeidsflyt-orientert. Det spør aldri om skjermbilder eller teknologi, bare om
input, data, regler, output og koblinger. Utseende og stack er Claudes jobb.

### De sju delene

| Del | Spørsmålet | Blir til i briefen |
|---|---|---|
| Formål | Hva er problemet, hvordan vet vi at det virker? | Innledning og akseptansekriterier |
| Aktører og start | Hvem bruker den, hva setter den i gang? | Roller og trigger |
| Inputs | Hva kommer inn, av hvilken type, fra hvor, påkrevd? | Felttabell |
| Data | Hvilke «ting» må huskes, hvem eier dem, hvor lagres de? | Datamodell |
| Steg og regler | Hva skjer i rekkefølge, hvilke «hvis … så»? | Nummerert flyt med regler |
| Outputs | Hva kommer ut, i hvilket format, til hvem? | Output-tabell |
| Koblinger | Hvilke andre flyter og systemer, hvilken retning? Hva er utenfor scope? | Integrasjoner og avgrensning |

Briefen avslutter med faste krav til bygget (norsk UI, mobil først, tilgjengelighet, validering,
roller styrer tilgang, README). Disse speiler `Code/CLAUDE.md`, slik at det Claude bygger fra en
brief følger samme standard som resten av kodebasen.

### Komplett-sjekk

Hver del får status tom, påbegynt eller ferdig. «Ferdig» krever det minste Claude trenger:
navn + type på hver input, minst to steg, mottaker på hver output, avgrensning satt. Prosenten
øverst er andel ferdige deler. Den er en hjelp, ikke en sperre. Briefen kan kopieres når som helst.

## Det som er bygget (MVP, versjon 1)

- Én side, alt lagres i nettleseren under nøkkelen `flytdesigner:v1`.
- Eksempelflyt («Tilbudsforespørsel», bygget rundt fastpris-portalen) så første møte viser hva
  et komplett svar ser ut som.
- Live brief, kopier til utklippstavle, rå tekst som reserve.
- JSON-eksport og -import for å dele en flyt mellom kolleger. Import valideres med zod.
- Tester på brief-generatoren, lagring/import og komplett-sjekken.

## Veikart

1. **Flere flyter per bruker.** I dag finnes én flyt om gangen. Liste med navn, opprettet og
   komplett-prosent. Ny lagringsnøkkel `flytdesigner:v2` med migrering fra v1.
2. **Koblinger som peker på faktiske flyter.** Når vi har flere flyter kan «Koblinger» velge fra
   listen i stedet for fritekst, og briefen kan ta med et sammendrag av den koblede flyten.
   Dette er kjernen i ønsket om at flytene skal henge sammen på tvers av apper.
3. **Delt lagring.** Supabase med innlogging og RLS bundet til `auth.uid()`. Alle i selskapet ser
   alle flyter, bare eier kan endre. Krever test som leser en annen brukers rad og forventer tomt svar.
4. **Registrer eksisterende apper.** En liste over apper og systemer vi allerede har (fastpris-
   portalen, Teams, SharePoint, regnskap) med hva de tilbyr av data, slik at koblinger blir
   konkrete og gjenbrukbare.
5. **Claude-hjelp i skjemaet.** «Foreslå steg» eller «finn hull» via en edge function som
   validerer brukeren med `supabase.auth.getUser()`, med rate-limit. Ikke før 3 er på plass.
6. **Eksport til fil.** Last ned briefen som `.md` og flyten som `.json`, i tillegg til kopiering.

## Bevisste valg

- Norsk bokmål i hele UI-et, fordi brukerne er norske og briefen skal leses av kolleger før den
  sendes til Claude. Briefen selv er også på norsk. Claude leser norsk fint.
- Ingen «AI-generer beskrivelsen» i første versjon. Poenget er at kollegaen tenker gjennom
  flyten. Hjelpen skal komme som spørsmål, ikke som ferdig tekst.
- Ingen visuell flytdiagram-editor. Det er tidkrevende å bygge og tilfører lite for Claude.
  En nummerert liste med regler er mer presis enn bokser og piler.
