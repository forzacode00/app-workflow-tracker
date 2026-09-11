import { OVERVIEW_OFFSET_X, OVERVIEW_OFFSET_Y, type Workspace } from "../workspace";
import { bygg, nettsted } from "../bygg";

/**
 * Eksempel: et enkelt CRM for et konsulentselskap, som fem moduler som snakker sammen.
 * Kontakter → Muligheter → Tilbud, Aktiviteter på tvers, og Rapportering som leser fra de andre.
 * Utfallet på en mulighet settes ett sted: i Tilbud når det finnes et tilbud, ellers i Muligheter.
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
          ["Selger", "Intern, innlogget. Ser alle firmaer og personer, endrer dem hen eier."],
          ["Daglig leder", "Intern, innlogget. Ser og endrer alt, kan slette og arkivere."],
        ],
        start: { tittel: "Noen registrerer et nytt firma", notat: "Fra skjema i appen, eller fra en mulighet som kommer inn." },
        steg: [
          { tittel: "Selger slår opp firmaet", notat: "Organisasjonsnummeret skrives inn; navn og adresse hentes fra Brønnøysund.", system: 0, regel: ["Finnes org.nummeret fra før, åpnes det eksisterende firmaet", "Ingen duplikater. Eksempel: 912 345 678 finnes, da vises kortet i stedet for et nytt skjema."] },
          { tittel: "Selger legger til kontaktperson", notat: "Navn, e-post, telefon, rolle og hvor vi fikk kontakten fra.", bruker: 1, regel: ["E-post må være unik per firma", "Eksempel: to «kari@firma.no» på samme firma avvises."] },
          { tittel: "Selger setter eier og status", notat: "Eier er selgeren som følger opp. Status: prospekt, kunde eller tidligere kunde.", bruker: 0, regel: ["Vunnet mulighet setter firmaet til kunde automatisk", "Ellers flytter bare eier eller daglig leder status. Eksempel: prospekt blir kunde når Tilbud melder «akseptert»."] },
          { tittel: "Appen viser kontaktkortet", system: 1, resultat: { tittel: "Kontaktkort med alt om firmaet", notat: "Side i appen: firma, personer, eier, status og aktivitetslogg. Knapp som åpner e-post i Outlook.", til: 0 } },
          { tittel: "Daglig leder sletter eller arkiverer", notat: "Kontaktperson slettes på forespørsel. Firma med vunnet tilbud arkiveres i stedet for å slettes.", bruker: 1, regel: ["Slettet kontaktperson: aktivitetene beholdes anonymisert", "GDPR: navn og e-post fjernes, «hva som ble sagt» beholdes uten person. Prospekter uten aktivitet på 24 måneder slettes automatisk."] },
        ],
        data: [
          ["Firma", "Felter: navn, org.nummer, adresse, bransje, eier, status, sist kontakt, opprettet.\nStatuser: prospekt → kunde → tidligere kunde. Eier eller daglig leder flytter, unntatt kunde som settes av vunnet tilbud."],
          ["Kontaktperson", "Felter: navn, e-post, telefon, rolle, firma, kilde (hvor vi fikk kontakten), status (aktiv eller sluttet), sist kontaktet."],
        ],
        systemer: [
          { tittel: "Brønnøysundregistrene", notat: "Vi henter firmanavn og adresse fra org.nummer. Åpent API, ingen innlogging.", leser: true },
          { tittel: "Outlook", notat: "Vi åpner en ny e-post til kontaktpersonen. Vi lagrer ingenting i Outlook." },
        ],
        sporsmal: ["Skal vi importere det gamle regnearket, eller starte på nytt?", "Hva skjer med et vunnet tilbud: skal det bli et prosjekt i en egen modul?"],
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
        personer: [["Selger", "Eier sine egne muligheter og ser alle."], ["Daglig leder", "Ser og endrer alle."]],
        start: { tittel: "En mulighet registreres på et firma", notat: "Selgeren velger firma og kontaktperson fra Kontakter og skriver hva muligheten gjelder. Henvendelser fra nettsiden kommer inn uten eier.", ref: "crm-kontakter" },
        steg: [
          { tittel: "Selger tar en henvendelse uten eier", notat: "Første selger som trykker «Ta» blir eier.", system: 0, regel: ["Henvendelser uten eier vises for alle selgere", "Etter 2 virkedager uten eier varsles daglig leder."] },
          { tittel: "Selger kvalifiserer muligheten", notat: "Har de et behov, budsjett og en beslutningstaker?", bruker: 0, regel: ["Uten beslutningstaker kan ikke fasen flyttes fra «ny»", "Eksempel: mangler feltet beslutningstaker, er «kontaktet» sperret."] },
          { tittel: "Selger setter fase, verdi og forventet dato", bruker: 0, regel: ["Sannsynlighet følger fasen, men kan overstyres", "ny 10 %, kontaktet 30 %, møte 60 %, tilbud 80 %. Fasen «tilbud» krever verdi i kroner; 0 kr avvises."], resultat: { tittel: "Mulighet i fase tilbud", notat: "Felter som sendes: mulighet-id, firma, kontaktperson, verdi, hva kunden ba om, tjeneste.", ref: "crm-tilbud", felter: 0 } },
          { tittel: "Selger flytter muligheten mellom faser", notat: "Dra kortet på tavlen. Når selgeren drar kortet til «tilbud», starter Tilbud-modulen. Tilbud setter aldri fasen selv.", regel: ["Ingen aktivitet på 14 dager flagger muligheten", "Vises gult på tavlen og i ukesrapporten."] },
          { tittel: "Utfall registreres", notat: "Vunnet eller tapt.", regel: ["Utfallet settes ett sted: fra Tilbud når det finnes et tilbud, ellers her", "Akseptert tilbud = vunnet, avslått eller utløpt = tapt. Tapt krever årsak fra liste: pris, tidspunkt, valgte konkurrent, ikke svar."], resultat: { tittel: "Utfall på muligheten", notat: "Felter som sendes: mulighet-id, utfall, verdi, årsak, dato, selger.", ref: "crm-rapportering", felter: 0 } },
        ],
        data: [["Mulighet", "Felter: firma, kontaktperson, beslutningstaker (kontaktperson), tittel, hva kunden ba om, tjeneste, fase, verdi, sannsynlighet, eier, forventet dato, utfall, tapt-årsak, sist aktivitet.\nFaser: ny → kontaktet → møte → tilbud → vunnet eller tapt. Kan gå bakover, men aldri fra vunnet eller tapt."]],
        systemer: [{ tittel: "Skjemaet på nettsiden", notat: "Nye henvendelser kommer inn som muligheter i fase «ny», uten eier. Vi leser skjemaet, endrer det ikke.", leser: true }],
      },
      { x: OVERVIEW_OFFSET_X, y: 0 },
    ),
    bygg(
      {
        id: "crm-tilbud",
        navn: "Tilbud",
        maal: "Sende et riktig tilbud på under en time",
        maalNotat: "Tilbud skrives fra bunnen i Word hver gang, og daglig leder ser dem først etterpå.\nVirker når: et standardtilbud er sendt innen én time etter at muligheten er klar, og alle over 200 000 kr er godkjent før sending.",
        personer: [["Selger", "Lager og sender egne tilbud, ser alle."], ["Daglig leder", "Godkjenner store tilbud."], ["Kunde", "Ekstern, uten innlogging. Får tilbudet som PDF på e-post."]],
        start: { tittel: "En mulighet er i fase tilbud", notat: "Kommer fra Muligheter med mulighet-id, firma, kontaktperson, verdi, hva kunden ba om og tjeneste.", ref: "crm-muligheter" },
        steg: [
          { tittel: "Selger lager tilbudet fra mal", notat: "Malen for tjenesten gir linjene. Én linje er beskrivelse, timer og timepris, eller en fastpris. Sum er uten mva.", bruker: [0, 1], system: 0 },
          { tittel: "Daglig leder godkjenner", bruker: 0, regel: ["Over 200 000 kr må daglig leder godkjenne før sending", "Eksempel: 250 000 kr sendes ikke før leder har trykket «Godkjenn». 200 000 kr trenger ikke, og går rett fra utkast til sendt. Avslår leder, går tilbudet tilbake til utkast med kommentar."] },
          { tittel: "Selger sender tilbudet til kunden", notat: "PDF fra malen, sendt til valgt kontaktperson. Status blir «sendt» med dato.", system: 1, bruker: 0, resultat: { tittel: "Tilbud som PDF på e-post til kunden", notat: "Gyldig 30 dager fra sendt dato.", til: 2 } },
          { tittel: "Appen melder at tilbudet er sendt", resultat: { tittel: "Tilbud sendt", notat: "Felter som sendes: tilbud-id, mulighet-id, firma, kontaktperson, selger, sendt dato, gyldig til.", ref: "crm-aktiviteter", felter: 0 } },
          { tittel: "Selger registrerer kundens svar", regel: ["Ubesvart tilbud settes til utløpt dagen etter gyldig til", "Selgeren får beskjed dagen før. Utløpt regnes som tapt med årsak «ikke svar». Nytt tilbud på samme mulighet er lov, det gamle blir «erstattet»."], resultat: { tittel: "Svar på tilbudet", notat: "Felter som sendes: tilbud-id, mulighet-id, svar (akseptert, avslått, utløpt, erstattet), årsak ved avslått (pris, tidspunkt, valgte konkurrent), dato.", ref: "crm-muligheter", felter: 0 } },
        ],
        data: [
          ["Tilbud", "Felter: mulighet, firma, sendt til (kontaktperson), eier, linjer, sum uten mva, gyldig til, sendt dato, status, godkjent av, kommentar fra leder.\nStatuser: utkast → til godkjenning → godkjent → sendt → akseptert, avslått, utløpt eller erstattet. Til godkjenning → utkast når leder avslår."],
          ["Tilbudslinje", "Felter: tilbud, beskrivelse, timer, timepris, fastpris, sum. Enten timer × timepris eller fastpris, ikke begge."],
        ],
        systemer: [
          { tittel: "Tilbudsmalene", notat: "Word-maler per tjeneste i SharePoint. Vi leser dem for å hente linjer og tekst; vi endrer dem ikke.", leser: true },
          { tittel: "E-post", notat: "PDF sendes fra en felles avsender med selgeren som svar-til, så vi slipper tilgang til hver selgers postkasse." },
        ],
        sporsmal: ["Hvem godkjenner daglig leders egne tilbud over 200 000 kr?", "Kan PDF-en lages fra en mal i appen i stedet for Word-malene i SharePoint?"],
      },
      { x: OVERVIEW_OFFSET_X * 2, y: 0 },
    ),
    bygg(
      {
        id: "crm-aktiviteter",
        navn: "Aktiviteter",
        maal: "Ingen kunde eller tilbud blir glemt",
        maalNotat: "Oppfølging skjer «når det passer». Noen tilbud dør stille, og kunder hører ikke fra oss etter levering.\nVirker når: hvert sendt tilbud har en planlagt neste aktivitet, og ingen kunde har gått 90 dager uten kontakt.",
        personer: [["Selger", "Planlegger og logger egne aktiviteter, ser alle."], ["Daglig leder", "Ser alle."]],
        start: { tittel: "En aktivitet planlegges eller logges på et firma eller en mulighet", notat: "Selgeren gjør det selv, eller det skjer automatisk når et tilbud er sendt." },
        steg: [
          { tittel: "Appen oppretter aktivitet for sendt tilbud", notat: "Tilbud sender «Tilbud sendt» hit. Da lages en planlagt oppfølging 7 dager senere.", bruker: 0, regel: ["Et sendt tilbud må alltid ha en planlagt aktivitet", "Eksempel: uten dato får selgeren rød markering på tavlen."] },
          { tittel: "Selger planlegger neste aktivitet", notat: "Samtale, e-post eller møte, med dato, på et firma eller en mulighet.", bruker: 0 },
          { tittel: "Appen påminner selgeren", notat: "Melding i Teams samme morgen.", system: 0 },
          { tittel: "Selger logger aktiviteten", notat: "Hva som ble sagt, og neste steg. Oppdaterer «sist kontakt» på firmaet.", bruker: 0, resultat: { tittel: "Aktivitetslogg på kontaktkortet", notat: "Felter som sendes: firma, dato, type, notat, utført av.", ref: "crm-kontakter", felter: 0 }, regel: ["Utsatt gir ny aktivitet om 14 dager, maks to ganger, aldri etter tilbudets gyldighet", "Deretter må selgeren registrere utfall i Muligheter eller Tilbud. Aktiviteter setter aldri utfall selv."] },
          { tittel: "Appen flagger firmaer uten kontakt på 90 dager", notat: "Nattjobb. Vises på tavlen og i ukesrapporten.", bruker: 0 },
        ],
        data: [["Aktivitet", "Felter: type, dato, notat, firma, mulighet, tilbud, utført av, status.\nStatuser: planlagt → gjort, eller planlagt → avlyst."]],
        systemer: [
          { tittel: "Microsoft Teams", notat: "Vi sender påminnelser til selgeren i kanalen «Salg»." },
        ],
      },
      { x: OVERVIEW_OFFSET_X * 3, y: 0 },
    ),
    bygg(
      {
        id: "crm-rapportering",
        navn: "Rapportering",
        maal: "Mandagsmøtet starter med tall, ikke med spørsmål",
        maalNotat: "Daglig leder bruker søndagen på å samle tall fra selgerne.\nVirker når: ukesrapporten ligger klar mandag kl. 07 uten at noen har gjort noe.",
        personer: [["Daglig leder", "Ser alt, også per selger."], ["Selger", "Ser bare egne tall, og summen for alle."]],
        start: { tittel: "Hver mandag kl. 07, eller når en mulighet får utfall", notat: "Tidsstyrt for ukesrapporten, og løpende for dashbordet. Utfall kommer fra Muligheter med mulighet-id, utfall, verdi, årsak, dato og selger.", ref: "crm-muligheter" },
        steg: [
          { tittel: "Appen henter vunnet og tapt siste uke", bruker: 0, system: [0, 1] },
          { tittel: "Appen beregner pipeline-verdi per fase", notat: "Verdi ganger sannsynlighet, lest fra Muligheter.", system: 1, regel: ["Bare daglig leder ser omsetning per selger", "Selgere ser summen for alle, men navn bare på egne."] },
          { tittel: "Appen finner det som trenger oppmerksomhet", notat: "Muligheter uten aktivitet på 14 dager og firmaer uten kontakt på 90 dager, lest fra Aktiviteter.", system: 2 },
          { tittel: "Appen lager ukesrapporten", resultat: { tittel: "Ukesrapport på e-post til daglig leder", notat: "Vunnet, tapt, pipeline per fase, det som trenger oppmerksomhet.", til: 0 } },
          { tittel: "Appen oppdaterer dashbordet", resultat: { tittel: "Dashbord-side", notat: "Samme tall, alltid oppdatert, filter på selger og periode.", til: 1 } },
        ],
        data: [["Ukesrapport", "Felter: uke, vunnet sum, tapt sum, pipeline per fase, muligheter flagget, firmaer flagget."]],
        systemer: [
          { tittel: "Kontakter", notat: "Vi leser firma og eier for å gruppere per selger.", ref: "crm-kontakter", leser: true },
          { tittel: "Muligheter", notat: "Vi leser fase, verdi og sannsynlighet.", ref: "crm-muligheter", leser: true },
          { tittel: "Aktiviteter", notat: "Vi leser flaggede muligheter og firmaer.", ref: "crm-aktiviteter", leser: true },
        ],
        sporsmal: ["Skal rapporten også gå til styret én gang i måneden?"],
      },
      { x: OVERVIEW_OFFSET_X, y: OVERVIEW_OFFSET_Y * 1.6 },
    ),
  ]);
