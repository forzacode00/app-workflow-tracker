# Nettstedet: alle moduler og grensesnittene mellom dem

5 moduler, tegnet av kolleger hos Involved Consulting. Hver modul har egen brief. Dette dokumentet viser hvordan de henger sammen.

## Moduler

### Kontakter
- Mål: Ett sted for alle kunder og kontaktpersoner
- Starter med: Noen registrerer et nytt firma
- Gir: Kontaktkort med alt om firmaet
- 20 bokser, 2 åpne spørsmål

### Muligheter
- Mål: Vite hvor hver salgsmulighet står, uten å spørre selgeren
- Starter med: En mulighet registreres på et firma
- Gir: Mulighet i fase tilbud; Utfall på muligheten
- 18 bokser, 0 åpne spørsmål

### Tilbud
- Mål: Sende et riktig tilbud på under en time
- Starter med: En mulighet er i fase tilbud
- Gir: Tilbud som PDF på e-post til kunden; Tilbud sendt; Svar på tilbudet
- 21 bokser, 2 åpne spørsmål

### Aktiviteter
- Mål: Ingen kunde eller tilbud blir glemt
- Starter med: En aktivitet planlegges eller logges på et firma eller en mulighet
- Gir: Aktivitetslogg på kontaktkortet
- 14 bokser, 0 åpne spørsmål

### Rapportering
- Mål: Mandagsmøtet starter med tall, ikke med spørsmål
- Starter med: Hver mandag kl. 07, eller når en mulighet får utfall
- Gir: Ukesrapport på e-post til daglig leder; Dashbord-side
- 17 bokser, 1 åpne spørsmål

## Grensesnitt

Én kontrakt per pil, i dataenes retning, med boksene som beskriver den i hver ende. «(leser)» betyr at modulen bare leser, ikke skriver.

- **Kontakter → Muligheter**
  - «En mulighet registreres på et firma» (start i Muligheter). Selgeren velger firma og kontaktperson fra Kontakter og skriver hva muligheten gjelder. Henvendelser fra nettsiden kommer inn uten eier.
- **Muligheter → Tilbud**
  - «Mulighet i fase tilbud» (resultat i Muligheter). Felter som sendes: mulighet-id, firma, kontaktperson, verdi, hva kunden ba om, tjeneste. Data «Mulighet» i briefen for «Muligheter».
  - «En mulighet er i fase tilbud» (start i Tilbud). Kommer fra Muligheter med mulighet-id, firma, kontaktperson, verdi, hva kunden ba om og tjeneste.
- **Muligheter → Rapportering**
  - «Utfall på muligheten» (resultat i Muligheter). Felter som sendes: mulighet-id, utfall, verdi, årsak, dato, selger. Data «Mulighet» i briefen for «Muligheter».
  - «Hver mandag kl. 07, eller når en mulighet får utfall» (start i Rapportering). Tidsstyrt for ukesrapporten, og løpende for dashbordet. Utfall kommer fra Muligheter med mulighet-id, utfall, verdi, årsak, dato og selger.
  - «Muligheter» (system i Rapportering, leser). Vi leser fase, verdi og sannsynlighet.
- **Tilbud → Aktiviteter**
  - «Tilbud sendt» (resultat i Tilbud). Felter som sendes: tilbud-id, mulighet-id, firma, kontaktperson, selger, sendt dato, gyldig til. Data «Tilbud» i briefen for «Tilbud».
- **Tilbud → Muligheter**
  - «Svar på tilbudet» (resultat i Tilbud). Felter som sendes: tilbud-id, mulighet-id, svar (akseptert, avslått, utløpt, erstattet), årsak ved avslått (pris, tidspunkt, valgte konkurrent), dato. Data «Tilbud» i briefen for «Tilbud».
- **Aktiviteter → Kontakter**
  - «Aktivitetslogg på kontaktkortet» (resultat i Aktiviteter). Felter som sendes: firma, dato, type, notat, utført av. Data «Aktivitet» i briefen for «Aktiviteter».
- **Kontakter → Rapportering**
  - «Kontakter» (system i Rapportering, leser). Vi leser firma og eier for å gruppere per selger.
- **Aktiviteter → Rapportering**
  - «Aktiviteter» (system i Rapportering, leser). Vi leser flaggede muligheter og firmaer.

## Foreslått byggerekkefølge

1. Kontakter
2. Muligheter
3. Tilbud
4. Aktiviteter
5. Rapportering

## Krav til bygget

- Hver modul bygges for seg, fra sin egen brief, i rekkefølgen over.
- Grensesnittene over er kontrakter: samme feltnavn i begge ender. Den som sender, eier feltene. Ingen modul endrer en annens data direkte.
- Når alle moduler er bygget, skal denne oversikten stemme med det som faktisk snakker sammen.

---
Laget med Flytdesigner 2026-09-11.