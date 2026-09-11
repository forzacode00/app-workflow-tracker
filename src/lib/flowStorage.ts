import { emptyFlow, flowSchema, tidyEdges, type Flow } from "./flow";

export type ParseResult = { ok: true; flow: Flow } | { ok: false; error: string };

/**
 * Kjører ett kart (v2) gjennom skjemaet og rydder kanter. Brukes på alt som kommer utenfra,
 * også migrert v1. Lagringen skjer i `workspaceStorage.ts`; v2 finnes bare som importformat.
 */
export function validateFlow(candidate: unknown): ParseResult {
  const result = flowSchema.safeParse({ ...emptyFlow(), ...(candidate as Record<string, unknown>) });
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path.length ? first.path.join(".") : "ukjent felt";
    const why = first?.code === "custom" ? first.message : "har en verdi Flytdesigner ikke kjenner";
    return { ok: false, error: `«${where}»: ${why}. Be kollegaen eksportere på nytt.` };
  }
  return { ok: true, flow: tidyEdges(result.data) };
}
