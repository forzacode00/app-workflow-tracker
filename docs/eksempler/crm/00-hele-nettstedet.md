# Nettstedet: alle moduler og grensesnittene mellom dem

5 moduler, tegnet av kolleger hos Involved Consulting. Hver modul har egen brief. Dette dokumentet viser hvordan de henger sammen.

## Moduler

### Kontakter
- Mål: Ett sted for alle kunder og kontaktpersoner
- Starter med: Noen registrerer et nytt firma
- Gir: Kontaktkort med alt om firmaet
- 16 bokser, 1 åpne spørsmål

### Muligheter
- Mål: Vite hvor hver salgsmulighet står, uten å spørre selgeren
- Starter med: En mulighet registreres på en kontakt
- Gir: Mulighet klar for tilbud; Utfall på muligheten
- 18 bokser, 1 åpne spørsmål

### Tilbud
- Mål: Sende et riktig tilbud på under en time
- Starter med: En mulighet er klar for tilbud
- Gir: Tilbud som PDF på e-post til kunden; Tilbud sendt; Svar på tilbudet
- 18 bokser, 1 åpne spørsmål

### Oppfølging
- Mål: Ingen tilbud eller kunde blir glemt
- Starter med: Et tilbud er sendt
- Gir: Aktivitetslogg på kontaktkortet; Utfall etter oppfølging
- 13 bokser, 0 åpne spørsmål

### Rapportering
- Mål: Mandagsmøtet starter med tall, ikke med spørsmål
- Starter med: Hver mandag kl. 07, eller når en mulighet får utfall
- Gir: Ukesrapport på e-post til daglig leder; Dashboard-side
- 14 bokser, 1 åpne spørsmål

## Grensesnitt

- **Kontakter → Muligheter**: En mulighet registreres på en kontakt. Selgeren velger et firma fra Kontakter og skriver hva muligheten gjelder.
- **Muligheter → Tilbud**: Mulighet klar for tilbud. Kontakt, verdi og det kunden ba om. Tilbud-modulen tar over.
- **Muligheter → Rapportering**: Utfall på muligheten. Vunnet eller tapt, med verdi og årsak. Går til rapporteringen.
- **Muligheter → Tilbud**: En mulighet er klar for tilbud. Kommer fra Muligheter med kontakt og verdi.
- **Tilbud → Oppfølging**: Tilbud sendt. Oppfølging-modulen tar over fra her.
- **Tilbud → Muligheter**: Svar på tilbudet. Akseptert, avslått eller utløpt. Muligheter får utfallet.
- **Tilbud → Oppfølging**: Et tilbud er sendt. Kommer fra Tilbud.
- **Oppfølging → Kontakter**: Aktivitetslogg på kontaktkortet. Vises under firmaet i Kontakter.
- **Oppfølging → Muligheter**: Utfall etter oppfølging. Muligheter får vunnet, tapt eller utsatt.
- **Muligheter → Rapportering**: Hver mandag kl. 07, eller når en mulighet får utfall. Tidsstyrt for ukesrapporten, og løpende for tavlen.
- **Rapportering → Kontakter**: Kontakter. Vi leser firma og eier derfra for å gruppere per selger.

## Foreslått byggerekkefølge

1. Kontakter
2. Muligheter
3. Tilbud
4. Oppfølging
5. Rapportering

## Krav til bygget

- Hver modul bygges for seg, fra sin egen brief, i rekkefølgen over.
- Grensesnittene over er kontrakter: samme navn på data i begge ender, og ingen modul endrer en annen.
- Når alle moduler er bygget, skal denne oversikten stemme med det som faktisk snakker sammen.

---
Laget med Flytdesigner 2026-09-11.