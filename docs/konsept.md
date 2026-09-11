# Flytdesigner: konsept og veikart

Skrevet 2026-09-11. Oppdatert samme dag etter at Magnus prøvde første versjon.

## Problemet

Involved Consulting har ingen utviklere eller designere. Kollegene vet hva de trenger, men når de
beskriver det for Claude blir resultatet feil, fordi beskrivelsen mangler det en utvikler ville
spurt om: hva som starter flyten, hvem som eier dataene, reglene, hva som er utenfor scope, og hvordan
den nye tingen henger sammen med det vi allerede har laget.

## Løsningen: et kart som vokser

Første versjon var et skjema i sju deler. Magnus' tilbakemelding: for mye informasjon, for
steg-for-steg. Man skal kunne starte smått og la det vokse.

Derfor er appen nå et fritt lerret. Du starter med én boks, målet, og legger til det neste fra den.
Hver boks har en type, en tittel og ett notat. Ikke mer. Pilene mellom boksene er strukturen:
rekkefølgen på stegene, hvilken regel som hører til hvilket steg, hvilke data et steg bruker.

### Bokstypene

| Type | Spørsmålet den svarer på | I briefen |
|---|---|---|
| Mål | Hva vil du oppnå, og hvordan vet du at det er løst? | Innledning |
| Person | Hvem bruker flyten? Intern/ekstern, innlogging, hva de ser | Personer og roller |
| Start | Hva setter flyten i gang? | Det som starter flyten |
| Steg | Én ting som skjer, og hvem som gjør det | Nummerert liste etter pilene |
| Regel | «Når … skal …», med eksempel og hva som skjer hvis det ikke går | Under steget den henger på |
| Data | Noe som må huskes, med felter, eier og statuser | Datamodell |
| Resultat | Det noen sitter igjen med, til hvem, når | Resultater |
| System | En app eller flyt dere allerede har. Skal ikke endres | Koblinger |
| Spørsmål | Det dere ikke vet ennå | Åpne spørsmål, først i listen |

Hver type vet hvilke typer som følger naturlig etter den («+» på boksen legger til den første).
Det er slik kartet vokser uten at brukeren må kjenne hele modellen på forhånd.

### Briefen

Skrives fra kartet, deterministisk. Brukerinnholdet rammes inn som beskrivelse, ikke instruksjoner,
og escapes så det aldri lager nye overskrifter. Nederst kommer «Åpne spørsmål» (spørsmålsboksene,
pluss det generatoren selv ser mangler: ingen start, ingen resultat, tomme eller frakoblede bokser)
og «Krav til bygget» (antakelser først, Gitt/når/så, én test per regel, ikke rør koblede systemer,
vis testresultat). Tallet på «Vis brief»-knappen er antall åpne spørsmål.

## Det som er bygget

- Fritt lerret med React Flow: dra, zoom, trekk piler, slett med Delete.
- Sidepanel for valgt boks: tittel, notat, type, og knapper for å legge til det neste.
- Palett nederst med alle typer. Legger til koblet fra valgt boks hvis noen er valgt.
- Eksempelkart ved første besøk, merket som eksempel. «Start egen flyt» gir én målboks.
- Lagring i nettleseren (`flytdesigner:v2`). Kart fra det gamle skjemaet (v1) løftes automatisk.
- Brief-skuff med kopiering og JSON-deling. Angre på tøm, eksempel og import.
- 78 tester: modell, migrering, brief, lagring, hooken og rendertester av appen.

## Veikart

1. **Flere kart per bruker.** Liste med navn og antall åpne spørsmål. Bytte mellom kart.
2. **System-bokser som peker på andre kart.** Når vi har flere kart, kan en systemboks velge et
   annet kart, og briefen tar med et sammendrag av det. Dette er kjernen i «henger sammen på tvers».
3. **Delt lagring.** Supabase med innlogging og RLS bundet til `auth.uid()`. Alle i selskapet ser
   alle kart, bare eier endrer. Krever test som leser en annen brukers rad og forventer tomt svar.
4. **Registrer eksisterende apper.** En felles liste over systemer vi har, som systemboksen kan velge fra.
5. **Claude-hjelp på kartet.** «Hva mangler?» via edge function som validerer brukeren med
   `supabase.auth.getUser()`, med rate-limit. Ikke før 3 er på plass.
6. **Last ned** briefen som `.md` og kartet som `.json` eller bilde.

## Bevisste valg

- Én tittel og ett notat per boks. Struktur kommer fra piler og typer, ikke fra skjemafelt.
- Norsk bokmål i hele UI-et og i briefen. Claude leser norsk fint.
- Ingen «AI-generer kartet». Poenget er at kollegaen tenker gjennom flyten selv. Hjelp kommer som spørsmål.
- Ingen automatisk layout. Friheten til å plassere er poenget. Nye bokser legges til høyre for
  den de kommer fra, stablet under søsken, så det blir ryddig nok uten å låse noe.
