import { z } from "zod";

export const INPUT_TYPES = [
  "Kort tekst",
  "Lang tekst",
  "Tall",
  "Dato",
  "Valg fra liste",
  "Ja/nei",
  "Fil eller vedlegg",
  "E-postadresse",
  "Beløp",
] as const;

export const INPUT_SOURCES = [
  "Brukeren skriver inn",
  "Hentes fra annet system",
  "Beregnes automatisk",
] as const;

export const STORAGE_OPTIONS = [
  "I denne appen",
  "I et annet system vi eier",
  "I et regneark",
  "Ikke lagres, kun vises",
] as const;

export const LINK_DIRECTIONS = [
  "Vi henter data derfra",
  "Vi sender data dit",
  "Begge veier",
] as const;

export const OUTPUT_FORMATS = [
  "Side i appen",
  "E-post",
  "PDF",
  "Rad i regneark",
  "Melding i Teams",
  "Data til et annet system",
] as const;

export const TRIGGER_TYPES = [
  "Noen fyller ut et skjema",
  "Noen trykker på en knapp i en app vi har",
  "En e-post eller melding kommer inn",
  "Data endres i et annet system",
  "Et fast tidspunkt, f.eks. hver natt",
] as const;

export type InputType = (typeof INPUT_TYPES)[number];
export type InputSource = (typeof INPUT_SOURCES)[number];
export type StorageOption = (typeof STORAGE_OPTIONS)[number];
export type LinkDirection = (typeof LINK_DIRECTIONS)[number];
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];
export type TriggerType = (typeof TRIGGER_TYPES)[number];

/** Maks lengde på korte og lange tekstfelt. Brukes både i zod og som maxLength i UI. */
export const SHORT = 200;
export const LONG = 4000;
/** Maks antall rader per liste. Holder briefen lesbar og forhåndsvisningen rask. */
export const MAX_ITEMS = 30;

/** Tom streng er lov (feltet er ikke fylt ut ennå), men en ugyldig verdi er ikke det. */
const choice = <T extends readonly [string, ...string[]]>(list: T) =>
  z.union([z.literal(""), z.enum(list)]);

/** Felt som er lagt til etter første versjon. Manglende verdi i gammel lagring blir tom streng. */
const added = (max: number) => z.string().max(max).default("");

export const inputFieldSchema = z.object({
  navn: z.string().max(SHORT),
  type: choice(INPUT_TYPES),
  kilde: choice(INPUT_SOURCES),
  pakrevd: z.boolean(),
  beskrivelse: z.string().max(LONG),
});

export const dataEntitySchema = z.object({
  entitet: z.string().max(SHORT),
  felter: z.string().max(LONG),
  eier: z.string().max(SHORT),
  lagring: choice(STORAGE_OPTIONS),
  statuser: added(LONG),
});

export const stepSchema = z.object({
  tittel: z.string().max(SHORT),
  beskrivelse: z.string().max(LONG),
  regel: z.string().max(LONG),
  unntak: added(LONG),
});

export const outputSchema = z.object({
  navn: z.string().max(SHORT),
  format: choice(OUTPUT_FORMATS),
  mottaker: z.string().max(SHORT),
  kanal: z.string().max(LONG),
});

export const linkSchema = z.object({
  system: z.string().max(SHORT),
  retning: choice(LINK_DIRECTIONS),
  hva: z.string().max(LONG),
  hvordan: z.string().max(LONG),
});

export const workflowSchema = z.object({
  navn: z.string().max(SHORT),
  eier: z.string().max(SHORT),
  problem: z.string().max(LONG),
  suksess: z.string().max(LONG),
  brukere: z.string().max(LONG),
  triggerType: choice(TRIGGER_TYPES),
  trigger: z.string().max(LONG),
  avgrensning: z.string().max(LONG),
  ukjent: added(LONG),
  inputs: z.array(inputFieldSchema).max(MAX_ITEMS),
  data: z.array(dataEntitySchema).max(MAX_ITEMS),
  steg: z.array(stepSchema).max(MAX_ITEMS),
  outputs: z.array(outputSchema).max(MAX_ITEMS),
  koblinger: z.array(linkSchema).max(MAX_ITEMS),
  eksempel: z.boolean(),
});

export type InputField = z.infer<typeof inputFieldSchema>;
export type DataEntity = z.infer<typeof dataEntitySchema>;
export type Step = z.infer<typeof stepSchema>;
export type Output = z.infer<typeof outputSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Workflow = z.infer<typeof workflowSchema>;

export type ListKey = "inputs" | "data" | "steg" | "outputs" | "koblinger";
export type TextKey = Exclude<keyof Workflow, ListKey | "eksempel">;

export const emptyWorkflow = (): Workflow => ({
  navn: "",
  eier: "",
  problem: "",
  suksess: "",
  brukere: "",
  triggerType: "",
  trigger: "",
  avgrensning: "",
  ukjent: "",
  inputs: [],
  data: [],
  steg: [],
  outputs: [],
  koblinger: [],
  eksempel: false,
});

export const emptyItem = {
  inputs: (): InputField => ({ navn: "", type: "", kilde: "", pakrevd: false, beskrivelse: "" }),
  data: (): DataEntity => ({ entitet: "", felter: "", eier: "", lagring: "", statuser: "" }),
  steg: (): Step => ({ tittel: "", beskrivelse: "", regel: "", unntak: "" }),
  outputs: (): Output => ({ navn: "", format: "", mottaker: "", kanal: "" }),
  koblinger: (): Link => ({ system: "", retning: "", hva: "", hvordan: "" }),
} as const;

/** Sant når brukeren ikke har skrevet noe som helst. */
export const isBlank = (w: Workflow): boolean =>
  JSON.stringify({ ...w, eksempel: false }) === JSON.stringify(emptyWorkflow());
