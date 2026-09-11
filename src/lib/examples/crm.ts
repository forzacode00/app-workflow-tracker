import { OVERVIEW_OFFSET_X, OVERVIEW_OFFSET_Y, type Workspace } from "../workspace";
import { bygg, nettsted } from "./bygg";

/**
 * Eksempel: et enkelt CRM for et konsulentselskap, som fem moduler som snakker sammen.
 * Kontakter → Muligheter → Tilbud → Oppfølging, og Rapportering som leser fra de andre.
 * Ikke ekte data.
 */
export const crmWorkspace = (): Workspace =>
  nettsted([
    bygg(
      {
        id: "crm-kontakter",
        navn: "Kontakter",
        maal: "Ett sted for alle kunder og kontaktpersoner",
        maalNotat:
          "I dag ligger kundene i et regneark, i Outlook og i hodet på hver selger. Ingen vet hvem som eier en kunde.\nVirker når: en selger finner riktig kontaktperson på under 30 sekunder, og det finnes bare én rad per firma.",
        personer: [
          ["Selger", "Intern, innlogget. Ser alle kontakter, endrer sine egne."],
          ["Daglig leder", "Intern, innlogget. Ser og endrer alt, kan slette."],
        ],
        start: { tittel: "Noen registrerer et nytt firma", notat: "Fra skjema i appen, eller fra en mulighet som kommer inn." },
        steg: [
          { tittel: "Slå opp firmaet", notat: "Organisasjonsnummer hentes fra Brønnøysund.", system: 0, regel: ["Finnes org.nummeret fra før, åpnes det eksisterende firmaet", "Ingen duplikater. Eksempel: 912 345 678 finnes, da vises kortet i stedet for et nytt skjema."] },
          { tittel: "Legg til kontaktperson", notat: "Navn, e-post, telefon og rolle.", bruker: 1, regel: ["E-post må være unik per firma", "Eksempel: to «kari@firma.no» på samme firma avvises."] },
          { tittel: "Sett eier og status", notat: "Eier er selgeren som følger opp. Status: prospekt, kunde eller tidligere kunde.", bruker: 0 },
          { tittel: "Vis kontaktkortet", system: 1, resultat: { tittel: "Kontaktkort med alt om firmaet", notat: "Side i appen: firma, personer, eier, status og aktivitetslogg. Knapp som åpner e-post i Outlook." } },
        ],
        data: [
          ["Firma", "Felter: navn, org.nummer, bransje, eier, status, opprettet.\nStatuser: prospekt → kunde → tidligere kunde. Bare eier eller daglig leder flytter status."],
          ["Kontaktperson", "Felter: navn, e-post, telefon, rolle, firma, sist kontaktet."],
        ],
        systemer: [
          { tittel: "Brønnøysundregistrene", notat: "Vi henter firmanavn og adresse fra org.nummer. Skal ikke endres." },
          { tittel: "Outlook", notat: "Vi åpner e-post til kontaktpersonen derfra. Vi lagrer ingenting i Outlook." },
        ],
        sporsmal: ["Skal vi importere det gamle regnearket, eller starte på nytt?"],
      },
      { x: 0, y: 0 },
    ),
    bygg(
      {
        id: "crm-muligheter",
        navn: "Muligheter",
        maal: "Vite hvor hver salgsmulighet står, uten å spørre selgeren",
        maalNotat:
          "Muligheter lever i e-poster og notater. Daglig leder får ikke oversikt uten å ringe rundt.\nVirker når: pipeline-tavlen stemmer med virkeligheten på mandagsmøtet, uten forberedelse.",
        personer: [["Selger", "Eier sine egne muligheter."], ["Daglig leder", "Ser alle."]],
        start: { tittel: "En mulighet registreres på en kontakt", notat: "Selgeren velger et firma fra Kontakter og skriver hva muligheten gjelder.", ref: "crm-kontakter" },
        steg: [
          { tittel: "Kvalifiser muligheten", notat: "Har de et behov, budsjett og en beslutningstaker? Henvendelser fra nettsiden starter her.", system: 0, regel: ["Uten beslutningstaker blir muligheten liggende i «ny»", "Eksempel: «vet ikke hvem som bestemmer» gir ikke lov til å flytte til «kontaktet»."] },
          { tittel: "Sett fase, verdi og forventet dato", bruker: 0, regel: ["Fasen «tilbud» krever verdi i kroner", "Eksempel: 0 kr avvises."] },
          { tittel: "Flytt muligheten mellom faser", notat: "Dra kortet på tavlen.", regel: ["Ingen aktivitet på 14 dager flagger muligheten", "Vises gult på tavlen og i ukesrapporten."] },
          { tittel: "Marker klar for tilbud", resultat: { tittel: "Mulighet klar for tilbud", notat: "Kontakt, verdi og det kunden ba om. Tilbud-modulen tar over.", ref: "crm-tilbud" } },
          { tittel: "Registrer vunnet eller tapt", regel: ["Tapt krever en årsak fra en liste", "Pris, tidspunkt, valgte konkurrent, ikke svar."], resultat: { tittel: "Utfall på muligheten", notat: "Vunnet eller tapt, med verdi og årsak. Går til rapporteringen.", ref: "crm-rapportering" } },
        ],
        data: [["Mulighet", "Felter: firma, tittel, fase, verdi, sannsynlighet, eier, forventet dato, tapt-årsak, sist aktivitet.\nFaser: ny → kontaktet → møte → tilbud → vunnet eller tapt. Kan gå bakover, men aldri fra vunnet/tapt."]],
        systemer: [{ tittel: "Skjemaet på nettsiden", notat: "Nye henvendelser kommer inn som muligheter i fase «ny», uten eier." }],
        sporsmal: ["Skal sannsynlighet settes av selgeren, eller følge fasen automatisk?"],
      },
      { x: OVERVIEW_OFFSET_X, y: 0 },
    ),
    bygg(
      {
        id: "crm-tilbud",
        navn: "Tilbud",
        maal: "Sende et riktig tilbud på under en time",
        maalNotat: "Tilbud skrives fra bunnen i Word hver gang, og daglig leder ser dem først etterpå.\nVirker når: et standardtilbud er sendt innen én time etter at muligheten er klar, og alle over 200 000 kr er godkjent før sending.",
        personer: [["Selger", "Lager og sender."], ["Daglig leder", "Godkjenner store tilbud."]],
        start: { tittel: "En mulighet er klar for tilbud", notat: "Kommer fra Muligheter med kontakt og verdi.", ref: "crm-muligheter" },
        steg: [
          { tittel: "Lag tilbudet fra mal", notat: "Linjer med timer og fastpris fra malen for tjenesten.", bruker: 0, system: 0 },
          { tittel: "Få godkjenning", regel: ["Over 200 000 kr må daglig leder godkjenne før sending", "Eksempel: 250 000 kr sendes ikke før leder har trykket «Godkjenn»."] },
          { tittel: "Send tilbudet til kunden", system: 1, resultat: { tittel: "Tilbud som PDF på e-post til kunden", notat: "Med gyldighet 30 dager." } },
          { tittel: "Registrer at tilbudet er sendt", resultat: { tittel: "Tilbud sendt", notat: "Oppfølging-modulen tar over fra her.", ref: "crm-oppfolging" } },
          { tittel: "Registrer kundens svar", regel: ["Tilbud som ikke er besvart etter 30 dager settes til utløpt", "Selgeren får beskjed dagen før."], resultat: { tittel: "Svar på tilbudet", notat: "Akseptert, avslått eller utløpt. Muligheter får utfallet.", ref: "crm-muligheter" } },
        ],
        data: [["Tilbud", "Felter: mulighet, linjer, sum, gyldig til, status, godkjent av.\nStatuser: utkast → til godkjenning → sendt → akseptert, avslått eller utløpt."]],
        systemer: [{ tittel: "Tilbudsmalene", notat: "Word-maler per tjeneste i SharePoint. Vi leser dem, endrer dem ikke." }, { tittel: "E-post", notat: "Vi sender PDF fra selgerens adresse." }],
        sporsmal: ["Skal kunden kunne akseptere med én knapp i e-posten?"],
      },
      { x: OVERVIEW_OFFSET_X * 2, y: 0 },
    ),
    bygg(
      {
        id: "crm-oppfolging",
        navn: "Oppfølging",
        maal: "Ingen tilbud eller kunde blir glemt",
        maalNotat: "Oppfølging skjer «når det passer». Noen tilbud dør stille, og kunder hører ikke fra oss etter levering.\nVirker når: hvert sendt tilbud har en planlagt neste aktivitet, og ingen kunde har gått 90 dager uten kontakt.",
        personer: [["Selger", "Gjør oppfølgingen."]],
        start: { tittel: "Et tilbud er sendt", notat: "Kommer fra Tilbud.", ref: "crm-tilbud" },
        steg: [
          { tittel: "Planlegg neste aktivitet", notat: "Samtale, e-post eller møte, med dato.", bruker: 0, regel: ["Et sendt tilbud må alltid ha en planlagt aktivitet", "Eksempel: uten dato får selgeren rød markering på tavlen."] },
          { tittel: "Påminn selgeren", notat: "Melding i Teams samme morgen.", system: 0 },
          { tittel: "Logg aktiviteten", notat: "Hva som ble sagt, og neste steg.", bruker: 0, resultat: { tittel: "Aktivitetslogg på kontaktkortet", notat: "Vises under firmaet i Kontakter.", ref: "crm-kontakter" } },
          { tittel: "Registrer utfallet", regel: ["Utsatt gir ny aktivitet om 14 dager, maks tre ganger", "Deretter settes muligheten til tapt med årsak «ikke svar»."], resultat: { tittel: "Utfall etter oppfølging", notat: "Muligheter får vunnet, tapt eller utsatt.", ref: "crm-muligheter" } },
        ],
        data: [["Aktivitet", "Felter: type, dato, notat, firma, mulighet, utført av, gjort.\nStatuser: planlagt → gjort, eller planlagt → avlyst."]],
        systemer: [{ tittel: "Microsoft Teams", notat: "Vi sender påminnelser til selgeren. Kanalen «Salg»." }],
      },
      { x: OVERVIEW_OFFSET_X * 3, y: 0 },
    ),
    bygg(
      {
        id: "crm-rapportering",
        navn: "Rapportering",
        maal: "Mandagsmøtet starter med tall, ikke med spørsmål",
        maalNotat: "Daglig leder bruker søndagen på å samle tall fra selgerne.\nVirker når: ukesrapporten ligger klar mandag kl. 07 uten at noen har gjort noe.",
        personer: [["Daglig leder", "Ser alt, også per selger."], ["Selger", "Ser bare egne tall."]],
        start: { tittel: "Hver mandag kl. 07, eller når en mulighet får utfall", notat: "Tidsstyrt for ukesrapporten, og løpende for tavlen.", ref: "crm-muligheter" },
        steg: [
          { tittel: "Hent vunnet og tapt siste uke", bruker: 0, system: 0 },
          { tittel: "Beregn pipeline-verdi per fase", notat: "Verdi ganger sannsynlighet.", regel: ["Bare daglig leder ser omsetning per selger", "Selgere ser summen for alle, men navn bare på egne."] },
          { tittel: "Lag ukesrapporten", resultat: { tittel: "Ukesrapport på e-post til daglig leder", notat: "Vunnet, tapt, pipeline per fase, muligheter uten aktivitet." } },
          { tittel: "Oppdater dashboardet", resultat: { tittel: "Dashboard-side", notat: "Samme tall, alltid oppdatert, filter på selger og periode." } },
        ],
        data: [["Ukesrapport", "Felter: uke, vunnet sum, tapt sum, pipeline per fase, muligheter flagget."]],
        systemer: [{ tittel: "Kontakter", notat: "Vi leser firma og eier derfra for å gruppere per selger.", ref: "crm-kontakter" }],
        sporsmal: ["Skal rapporten også gå til styret én gang i måneden?"],
      },
      { x: OVERVIEW_OFFSET_X, y: OVERVIEW_OFFSET_Y * 1.6 },
    ),
  ]);
