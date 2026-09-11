/**
 * Skriver briefene for et eksempel til Markdown-filer, så de kan leses og vurderes utenfor appen.
 *   npx tsx scripts/eksporter-briefer.ts crm docs/eksempler/crm
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { crmWorkspace } from "../src/lib/examples/crm";
import { moduleName } from "../src/lib/workspace";
import { buildModuleBrief, buildWorkspaceBrief } from "../src/lib/workspaceBrief";
import { exampleWorkspace } from "../src/lib/workspaceExample";
import { serializeWorkspace } from "../src/lib/workspaceStorage";

const which = process.argv[2] ?? "crm";
const out = process.argv[3] ?? join("docs", "eksempler", which);
const ws = which === "crm" ? crmWorkspace() : exampleWorkspace();
const today = "2026-09-11";

mkdirSync(out, { recursive: true });
writeFileSync(join(out, "00-hele-nettstedet.md"), buildWorkspaceBrief(ws, today));
ws.moduler.forEach((m, i) => {
  const slug = moduleName(m).toLowerCase().replace(/[^a-z0-9æøå]+/g, "-");
  writeFileSync(join(out, `${String(i + 1).padStart(2, "0")}-${slug}.md`), buildModuleBrief(ws, m.id, today));
});
writeFileSync(join(out, "nettsted.json"), serializeWorkspace(ws));
console.log(`${ws.moduler.length + 1} briefer skrevet til ${out}`);
