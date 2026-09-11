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
  "Bruker fyller ut et skjema",
  "Bruker trykker på en knapp i en eksisterende app",
  "E-post eller melding kommer inn",
  "Data endres i et annet system",
  "Tidsstyrt, kjører på et fast tidspunkt",
] as const;

const SHORT = 200;
const LONG = 4000;

/** Tom streng er lov (feltet er ikke fylt ut ennå), men en ugyldig verdi er ikke det. */
const choice = <T extends readonly [string, ...string[]]>(list: T) =>
  z.union([z.literal(""), z.enum(list)]);

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
});

export const stepSchema = z.object({
  tittel: z.string().max(SHORT),
  beskrivelse: z.string().max(LONG),
  regel: z.string().max(LONG),
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
  inputs: z.array(inputFieldSchema).max(100),
  data: z.array(dataEntitySchema).max(100),
  steg: z.array(stepSchema).max(100),
  outputs: z.array(outputSchema).max(100),
  koblinger: z.array(linkSchema).max(100),
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
  inputs: [],
  data: [],
  steg: [],
  outputs: [],
  koblinger: [],
  eksempel: false,
});

export const emptyItem = {
  inputs: (): InputField => ({ navn: "", type: "", kilde: "", pakrevd: false, beskrivelse: "" }),
  data: (): DataEntity => ({ entitet: "", felter: "", eier: "", lagring: "" }),
  steg: (): Step => ({ tittel: "", beskrivelse: "", regel: "" }),
  outputs: (): Output => ({ navn: "", format: "", mottaker: "", kanal: "" }),
  koblinger: (): Link => ({ system: "", retning: "", hva: "", hvordan: "" }),
} as const;
