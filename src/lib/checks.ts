import type { Workflow } from "./types";

export type CheckStatus = "done" | "partial" | "empty";

export type SectionCheck = {
  id: SectionId;
  label: string;
  status: CheckStatus;
};

export const SECTION_IDS = [
  "formaal",
  "aktorer",
  "inputs",
  "data",
  "steg",
  "outputs",
  "koblinger",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

const has = (v: string) => v.trim().length > 0;

const status = (done: boolean, partial: boolean): CheckStatus =>
  done ? "done" : partial ? "partial" : "empty";

/** Hvilke deler av flyten er ferdige nok til at Claude kan bygge fra dem. */
export function checkWorkflow(w: Workflow): SectionCheck[] {
  return [
    {
      id: "formaal",
      label: "Formål",
      status: status(
        has(w.navn) && has(w.problem) && has(w.suksess),
        has(w.navn) || has(w.problem) || has(w.suksess),
      ),
    },
    {
      id: "aktorer",
      label: "Aktører",
      status: status(has(w.brukere) && has(w.trigger), has(w.brukere) || has(w.trigger)),
    },
    {
      id: "inputs",
      label: "Inputs",
      status: status(
        w.inputs.length > 0 && w.inputs.every((i) => has(i.navn) && has(i.type)),
        w.inputs.length > 0,
      ),
    },
    {
      id: "data",
      label: "Data",
      status: status(
        w.data.length > 0 && w.data.every((d) => has(d.entitet) && has(d.felter)),
        w.data.length > 0,
      ),
    },
    {
      id: "steg",
      label: "Steg",
      status: status(w.steg.length >= 2 && w.steg.every((s) => has(s.tittel)), w.steg.length > 0),
    },
    {
      id: "outputs",
      label: "Outputs",
      status: status(
        w.outputs.length > 0 && w.outputs.every((o) => has(o.navn) && has(o.mottaker)),
        w.outputs.length > 0,
      ),
    },
    {
      id: "koblinger",
      label: "Koblinger",
      status: status(
        has(w.avgrensning) && w.koblinger.every((k) => has(k.system) && has(k.retning)),
        w.koblinger.length > 0 || has(w.avgrensning),
      ),
    },
  ];
}

export const completeness = (checks: SectionCheck[]): number =>
  Math.round((checks.filter((c) => c.status === "done").length / checks.length) * 100);
