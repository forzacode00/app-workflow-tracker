import type { FlowEdge, FlowNode } from "./flow";
import { exampleFlow } from "./flowExample";
import type { Module, Workspace } from "./workspace";

const n = (id: string, type: FlowNode["type"], tittel: string, notat: string, x: number, y: number, ref?: string): FlowNode => ({
  id,
  type,
  tittel,
  notat,
  x,
  y,
  ...(ref ? { ref } : {}),
});
const e = (from: string, to: string): FlowEdge => ({ id: `e-${from}-${to}`, from, to });

/** Modul 2 i eksempelet: starter der modul 1 slutter, og snakker tilbake til den. */
const followUp = (): Module => ({
  id: "eks-oppfolging",
  navn: "Oppfølging etter tilbud",
  eksempel: true,
  x: 340,
  y: 0,
  nodes: [
    n("maal", "maal", "Ingen tilbud blir glemt etter at de er sendt", "I dag husker salgsansvarlig å følge opp «når det passer». Noen tilbud dør stille.", 0, 0),
    n("salg", "person", "Salgsansvarlig", "Intern, innlogget.", -270, 0),
    n("start", "start", "Et tilbud får status «tilbud sendt»", "Kommer fra modulen Tilbudsforespørsel.", 270, 0, "eks-tilbud"),
    n("s1", "steg", "Vent sju dager", "", 540, -60),
    n("s2", "steg", "Send påminnelse til salgsansvarlig", "Med lenke til forespørselen.", 540, 50),
    n("s3", "steg", "Salgsansvarlig registrerer utfall", "Vunnet, tapt eller utsatt.", 540, 160),
    n("r1", "regel", "Utsatt gir ny påminnelse om 14 dager", "Maks tre ganger. Deretter settes tilbudet til tapt.", 810, 160),
    n("o1", "resultat", "Utfall på forespørselen", "Skrives tilbake til Tilbudsforespørsel.", 810, 50, "eks-tilbud"),
    n("sys", "system", "Tilbudsforespørsel", "Vi leser status derfra og skriver utfall tilbake.", 270, -150, "eks-tilbud"),
  ],
  edges: [e("maal", "salg"), e("maal", "start"), e("start", "s1"), e("s1", "s2"), e("s2", "s3"), e("s3", "r1"), e("s3", "o1"), e("sys", "start"), e("o1", "sys")],
});

/** Eksempelarbeidsområde med to moduler som snakker sammen. Ikke ekte data. */
export const exampleWorkspace = (): Workspace => {
  const first = exampleFlow();
  const tilbud: Module = {
    id: "eks-tilbud",
    navn: first.navn,
    nodes: first.nodes.map((node) => (node.id === "o2" ? { ...node, ref: "eks-oppfolging" } : node)),
    edges: first.edges,
    eksempel: true,
    x: 0,
    y: 0,
  };
  return { versjon: 3, moduler: [tilbud, followUp()], aktiv: tilbud.id };
};
