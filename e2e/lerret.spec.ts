import { expect, test, type Locator, type Page } from "@playwright/test";

const STORAGE_KEY = "flytdesigner:v2";
/** Lagring er forsinket i appen (SAVE_DELAY_MS). Vent litt lenger før lagret verdi leses. */
const SAVE_WAIT = 450;

/** Start på nytt med tomt lerret, og skriv målet. */
async function startOwn(page: Page, goal: string) {
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload();
  const title = page.getByLabel("Tittel");
  await expect(title).toBeFocused();
  await title.fill(goal);
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), STORAGE_KEY);

/** React Flow bruker pekerhendelser; Playwrights dragTo treffer ikke. Dra med musen i små steg. */
async function dragBy(page: Page, target: Locator, dx: number, dy: number) {
  const box = await target.boundingBox();
  if (!box) throw new Error("fant ikke elementet");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 8 });
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

/** Trekk en pil fra kildehåndtaket på én boks til målhåndtaket på en annen. */
async function connectBoxes(page: Page, from: Locator, to: Locator) {
  const src = await from.locator(".react-flow__handle.source").boundingBox();
  const dst = await to.locator(".react-flow__handle.target").boundingBox();
  if (!src || !dst) throw new Error("fant ikke håndtak");
  await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
  await page.mouse.down();
  await page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 2, { steps: 15 });
  await page.mouse.up();
}

test("dra en boks: posisjonen lagres og overlever omlasting", async ({ page }) => {
  await startOwn(page, "Mål");
  const box = page.locator(".react-flow__node").first();
  const before = await box.boundingBox();
  await dragBy(page, box, 250, 120);
  await page.waitForTimeout(SAVE_WAIT);
  const saved = await stored(page);
  const node = saved.nodes.find((n: { id: string }) => n.id === "maal");
  expect(node.x !== 0 || node.y !== 0).toBe(true);
  await page.reload();
  const after = await page.locator(".react-flow__node").first().boundingBox();
  expect(Math.abs((after?.x ?? 0) - (before?.x ?? 0)) + Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeGreaterThan(50);
});

test("trekk en pil fra én boks til en annen, og briefen viser koblingen", async ({ page }) => {
  await startOwn(page, "Mål");
  await page.getByRole("button", { name: "+ Steg" }).click();
  await page.getByLabel("Tittel").fill("Ta imot");
  // Klikk på lerretet så ingen boks er valgt; da lager paletten en frittstående boks uten pil.
  await page.locator(".react-flow__pane").click({ position: { x: 40, y: 40 } });
  await page.getByRole("group", { name: "Legg til boks" }).getByRole("button", { name: "Data" }).click();
  await page.getByLabel("Tittel").fill("Forespørsel");
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
  const data = page.locator(".react-flow__node", { hasText: "Forespørsel" });
  const step = page.locator(".react-flow__node", { hasText: "Ta imot" });
  await connectBoxes(page, data, step);
  await expect(page.locator(".react-flow__edge")).toHaveCount(2);
  await page.getByRole("button", { name: /^Vis brief/ }).click();
  await expect(page.getByLabel("Brief til Claude, kan rulles")).toContainText("Bruker data: Forespørsel");
});

test("Delete fjerner valgt boks med angre, men Backspace i tittelfeltet gjør det ikke", async ({ page }) => {
  await startOwn(page, "Mål");
  await page.getByRole("button", { name: "+ Steg" }).click();
  const title = page.getByLabel("Tittel");
  await title.fill("Steg en");
  await title.press("Backspace");
  await expect(title).toHaveValue("Steg e");
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await page.locator(".react-flow__node", { hasText: "Steg e" }).click();
  await page.keyboard.press("Delete");
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await expect(page.getByText("Fjernet.")).toBeVisible();
  await page.getByRole("button", { name: "Angre" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
});

test("slipp en pil på tomt lerret: ny boks der pilen ble sluppet", async ({ page }) => {
  await startOwn(page, "Mål");
  const src = await page.locator(".react-flow__node").first().locator(".react-flow__handle.source").boundingBox();
  const pane = await page.locator(".react-flow__pane").boundingBox();
  if (!src || !pane) throw new Error("fant ikke lerretet");
  await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
  await page.mouse.down();
  await page.mouse.move(pane.x + pane.width * 0.8, pane.y + pane.height * 0.7, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await expect(page.getByLabel("Rediger start")).toBeVisible();
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
});

test("import av JSON viser boksene i utsnittet, og angre tar dem bort", async ({ page }) => {
  await startOwn(page, "Mål");
  await page.getByRole("button", { name: "Vis eksempel" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(17);
  await page.waitForTimeout(SAVE_WAIT);
  const json = JSON.stringify(await stored(page));
  expect(json.length).toBeGreaterThan(1000);
  await page.getByRole("button", { name: "Start egen flyt" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await page.getByRole("button", { name: /^Vis brief/ }).click();
  await page.getByRole("button", { name: "Del som JSON" }).click();
  await page.getByLabel("Flyten som JSON. Lim inn en annen flyt her for å importere den.").fill(json);
  await page.getByRole("button", { name: "Importer flyten" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(17);
  const visible = await page.locator(".react-flow__node").first().boundingBox();
  const pane = await page.locator(".react-flow__pane").boundingBox();
  expect((visible?.x ?? -1) >= (pane?.x ?? 0) && (visible?.y ?? -1) >= (pane?.y ?? 0)).toBe(true);
  await page.getByRole("button", { name: "Angre" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
});
