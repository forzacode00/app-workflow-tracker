import type { Workflow } from "./types";

/** Eksempelflyt som viser hva et komplett utfylt skjema ser ut som. Ikke ekte data. */
export const exampleWorkflow = (): Workflow => ({
  eksempel: true,
  navn: "Tilbudsforespørsel",
  eier: "Salgsansvarlig",
  problem:
    "Kunder som har brukt fastpris-konfiguratoren sender e-post med spørsmål, og vi svarer manuelt. Det tar to til fem dager, og vi mister oversikt over hvem som venter. Ingen vet om et tilbud er sendt uten å lete i innboksen.",
  suksess:
    "Kunden får en bekreftelse innen ett minutt.\nSalgsansvarlig ser alle åpne forespørsler på én liste.\nIngen forespørsel er ubesvart etter 24 timer uten at noen har fått varsel.",
  brukere:
    "Kunde, ekstern, uten innlogging\nSalgsansvarlig, intern, innlogget\nKonsulent, intern, innlogget, kun lesetilgang",
  triggerType: "Bruker fyller ut et skjema",
  trigger:
    "Kunden trykker «Be om tilbud» etter å ha konfigurert en leveranse i fastpris-portalen",
  avgrensning:
    "Ingen e-signering. Ingen automatisk prisforhandling. Ingen integrasjon mot regnskap i MVP.",
  inputs: [
    { navn: "Firmanavn", type: "Kort tekst", kilde: "Brukeren skriver inn", pakrevd: true, beskrivelse: "" },
    {
      navn: "Kontakt-e-post",
      type: "E-postadresse",
      kilde: "Brukeren skriver inn",
      pakrevd: true,
      beskrivelse: "Brukes til bekreftelse og oppfølging",
    },
    {
      navn: "Valgt konfigurasjon",
      type: "Lang tekst",
      kilde: "Hentes fra annet system",
      pakrevd: true,
      beskrivelse: "Kommer fra konfiguratoren i fastpris-portalen, med beregnet pris",
    },
    { navn: "Ønsket oppstart", type: "Dato", kilde: "Brukeren skriver inn", pakrevd: false, beskrivelse: "" },
    { navn: "Kommentar", type: "Lang tekst", kilde: "Brukeren skriver inn", pakrevd: false, beskrivelse: "Maks 1000 tegn" },
  ],
  data: [
    {
      entitet: "Forespørsel",
      felter:
        "Firmanavn, e-post, konfigurasjon, pris, ønsket oppstart, kommentar, status (ny / under arbeid / tilbud sendt / avslått), opprettet, ansvarlig",
      eier: "Salgsansvarlig",
      lagring: "I denne appen",
    },
    {
      entitet: "Statusendring",
      felter: "Forespørsel, fra-status, til-status, hvem, tidspunkt, notat",
      eier: "Salgsansvarlig",
      lagring: "I denne appen",
    },
  ],
  steg: [
    {
      tittel: "Ta imot forespørsel",
      beskrivelse: "Skjemaet valideres og lagres som en forespørsel med status «ny».",
      regel: "Hvis e-post mangler eller er ugyldig: vis feil i skjemaet, ikke lagre.",
    },
    {
      tittel: "Bekreft til kunde",
      beskrivelse: "Kunden får en e-post med oppsummering av konfigurasjon og pris.",
      regel: "",
    },
    {
      tittel: "Varsle salgsansvarlig",
      beskrivelse: "Melding i Teams-kanalen «Salg» med lenke til forespørselen.",
      regel: "Hvis prisen er over 200 000 kr: varsle også daglig leder.",
    },
    {
      tittel: "Følg opp",
      beskrivelse: "Salgsansvarlig åpner forespørselen, setter status og ansvarlig, skriver notat.",
      regel: "Hvis status fortsatt er «ny» etter 24 timer: send påminnelse til salgsansvarlig.",
    },
    {
      tittel: "Avslutt",
      beskrivelse: "Status settes til «tilbud sendt» eller «avslått», med notat.",
      regel: "Status kan ikke gå tilbake til «ny».",
    },
  ],
  outputs: [
    { navn: "Bekreftelse til kunde", format: "E-post", mottaker: "Kunden", kanal: "Sendes automatisk rett etter innsending" },
    { navn: "Varsel om ny forespørsel", format: "Melding i Teams", mottaker: "Salgsansvarlig", kanal: "Kanalen «Salg»" },
    {
      navn: "Liste over åpne forespørsler",
      format: "Side i appen",
      mottaker: "Salgsansvarlig og konsulenter",
      kanal: "Sortert på eldste først, filtrer på status",
    },
  ],
  koblinger: [
    {
      system: "Fastpris-portalen (konfiguratoren)",
      retning: "Vi henter data derfra",
      hva: "Valgt konfigurasjon og beregnet pris",
      hvordan: "Konfiguratoren sender data med i skjemaet når kunden trykker «Be om tilbud»",
    },
    {
      system: "Microsoft Teams",
      retning: "Vi sender data dit",
      hva: "Varsel med lenke",
      hvordan: "Innkommende webhook i kanalen «Salg»",
    },
    {
      system: "Kundeliste (regneark i SharePoint)",
      retning: "Vi sender data dit",
      hva: "Ny rad per forespørsel",
      hvordan: "Etter MVP. Nevnes så Claude ikke låser datamodellen.",
    },
  ],
});
