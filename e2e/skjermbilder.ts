/**
 * Tar skjermbilder for manuell sjekk (lys/mørk, mobil/desktop). Kjøres for hånd:
 *   npx tsx e2e/skjermbilder.ts <utmappe> [url]
 * Ikke en test; ligger her fordi den bruker samme Playwright-oppsett.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2] ?? "skjermbilder";
const url = process.argv[3] ?? "http://127.0.0.1:4173/";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const scheme of ["light", "dark"] as const) {
  for (const [name, viewport] of [
    ["mobil", { width: 360, height: 740 }],
    ["desktop", { width: 1280, height: 800 }],
  ] as const) {
    const ctx = await browser.newContext({ viewport, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(url);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole("button", { name: "Start med spørsmålene" }).waitFor();
    await page.screenshot({ path: join(out, `${name}-${scheme}-velkommen.png`) });
    await page.getByRole("button", { name: "Start med spørsmålene" }).click();
    await page.getByLabel("Svar").fill("Svare kunder som ber om tilbud innen 24 timer");
    await page.screenshot({ path: join(out, `${name}-${scheme}-intervju.png`) });
    await page.getByRole("button", { name: "Neste" }).click();
    await page.getByRole("button", { name: "Hopp over" }).click();
    await page.getByLabel("Skriv ett om gangen").fill("Selger");
    await page.keyboard.press("Enter");
    await page.screenshot({ path: join(out, `${name}-${scheme}-intervju-liste.png`) });
    await page.getByRole("button", { name: "Avbryt" }).click();
    await page.getByLabel("Tittel").waitFor();
    await page.screenshot({ path: join(out, `${name}-${scheme}-tom.png`) });
    await page.getByLabel("Tittel").fill("Færre e-poster om tilbud");
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(out, `${name}-${scheme}-dytt.png`) });
    await page.getByRole("button", { name: "Slik tenker du" }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(out, `${name}-${scheme}-hjelp.png`) });
    await page.getByRole("button", { name: "Lukk", exact: true }).click();
    await page.getByLabel("Tittel").fill("");
    await page.getByRole("button", { name: "Vis eksempel" }).click();
    await page.getByRole("menuitem", { name: /Tilbudsforespørsel/ }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(out, `${name}-${scheme}-modul.png`) });
    await page.getByRole("button", { name: "Oversikt" }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(out, `${name}-${scheme}-oversikt.png`) });
    await page.getByRole("button", { name: /^Vis bestilling/ }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(out, `${name}-${scheme}-brief.png`) });
    await ctx.close();
  }
}
await browser.close();
console.log("skjermbilder i", out);
