import { Buffer } from "node:buffer";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.RAW_MATERIALS_E2E_URL ?? "http://127.0.0.1:3102";
const artifactDir =
  process.env.RAW_MATERIALS_E2E_ARTIFACT_DIR ?? join(tmpdir(), "formulator-saas-e2e");

async function main() {
  await mkdir(artifactDir, { recursive: true });
  logStep("launch browser");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const consoleMessages = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    consoleMessages.push(`pageerror: ${error.message}`);
  });

  logStep("open e2e route");
  await page.goto(`${baseUrl}/e2e/raw-materials`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await assertVisible(page.getByRole("heading", { name: "Raw material master" }), "master heading");
  await page.getByText("Status summary").click();
  const materialSummary = page.locator(".materialSummary");
  await assertVisible(materialSummary.getByText("Missing price"), "summary missing price");
  await assertVisible(materialSummary.getByText("Missing SAP"), "summary missing SAP");
  await page.getByLabel("Show").selectOption("all");
  await assertVisible(page.getByText("Showing 1-3 of 3"), "material show-all counter");
  await page.getByText("Add raw material").click();
  const createPanel = page.locator(".materialCreateDisclosure");
  await assertHidden(createPanel.getByLabel("Code"), "add-material code field");
  await assertHidden(createPanel.getByLabel("Ntotal"), "add-material Ntotal field");

  logStep("filter and open material");
  await page.getByPlaceholder("Code, SAP, name, family, alias").fill("experimental");
  await assertVisible(page.getByText("Extracto vegetal experimental"), "filtered material row");
  await page.getByRole("button", { name: "Open Extracto vegetal experimental" }).click();
  await assertVisible(page.getByText("Selected material"), "detail panel");

  logStep("edit master data");
  await page.getByRole("textbox", { name: "SAP code" }).fill("SAP-2002");
  const materialSwitches = page.locator(".materialSwitches");
  const activeCheckbox = materialSwitches.getByLabel("Active");
  const obsoleteCheckbox = materialSwitches.getByLabel("Obsolete");
  await obsoleteCheckbox.check();
  if (await activeCheckbox.isChecked()) {
    throw new Error("Active checkbox stayed checked after marking the material obsolete.");
  }
  await activeCheckbox.check();
  if (await obsoleteCheckbox.isChecked()) {
    throw new Error("Obsolete checkbox stayed checked after marking the material active.");
  }
  await page.getByRole("button", { name: "Save master" }).click();
  await assertVisible(page.getByText("SAP-2002").first(), "saved SAP code");

  logStep("edit chemical composition");
  await page.getByText("Chemical composition").click();
  const compositionPanel = page.locator(".materialParametersPanel");
  await compositionPanel.getByLabel("Find parameter").fill("valina");
  await assertVisible(compositionPanel.getByText("Valina", { exact: true }), "valina search match");
  await assertHidden(
    compositionPanel.getByText("Leucina", { exact: true }),
    "non-matching amino acid in valina search",
  );
  await assertVisible(compositionPanel.getByText("VAL", { exact: true }), "valina code search match");
  await compositionPanel.getByLabel("Find parameter").fill("");
  await page.getByLabel("Jump to parameter").selectOption({ label: "LYS | Lysine" });
  await page.getByRole("textbox", { name: "Lysine value" }).fill("3.1");
  await page.getByRole("button", { name: "Save Lysine value" }).click();
  await assertVisible(page.getByText("LYS: 3.1000 %").first(), "saved lysine value");
  await page.getByText("Advanced filters").click();
  await page
    .locator(".materialFamilyFilters")
    .locator(".multiSelectCombobox summary")
    .click();
  await page.locator(".materialFamilyFilters").getByLabel("Aminograma").check();
  await assertVisible(
    page.locator(".materialList").getByText("Extracto vegetal experimental"),
    "family-filtered material",
  );

  logStep("add price");
  await page.locator(".priceHistoryPanel > summary").click();
  const priceForm = page.locator(".priceForm");
  await priceForm.getByLabel("Price").fill("0.95");
  await priceForm.getByLabel("Supplier").fill("SAP Supplier");
  await priceForm.getByLabel("Source").fill("sap");
  await priceForm.getByLabel("Valid from").fill("2026-06-13");
  await page.getByRole("button", { name: "Add price" }).click();
  await assertVisible(page.getByText("0.9500").first(), "new price");

  logStep("preview SAP import");
  await page.locator(".sapImportPanel > summary").click();
  const sapImportPanel = page.locator(".sapImportPanel");
  await sapImportPanel.getByLabel("Excel or CSV").setInputFiles({
    name: "sap_fixture.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("codigo sap,nombre,precio\nSAP-2002,Extracto vegetal experimental,0.95\n"),
  });
  await page.getByRole("button", { name: "Preview SAP" }).click();
  await assertVisible(page.getByText("Price update detected."), "SAP preview row message");
  await assertVisible(page.getByText("Fuzzy match needs review."), "SAP review row message");

  logStep("apply SAP import");
  await page.getByRole("button", { name: "Apply ready rows" }).click();
  await assertVisible(page.getByText("applied").first(), "SAP applied status");

  logStep("responsive screenshots");
  await page.setViewportSize({ width: 390, height: 900 });
  await assertVisible(page.getByRole("heading", { name: "Raw material master" }), "mobile heading");
  await page.screenshot({
    path: join(artifactDir, "raw-materials-e2e-mobile.png"),
    timeout: 10_000,
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({
    path: join(artifactDir, "raw-materials-e2e-desktop.png"),
    timeout: 10_000,
  });

  logStep("close browser");
  await browser.close();

  const relevantMessages = consoleMessages.filter(
    (message) => !message.includes("Download the React DevTools"),
  );
  if (relevantMessages.length > 0) {
    throw new Error(`Unexpected browser console messages:\n${relevantMessages.join("\n")}`);
  }

  console.log("Raw material master e2e smoke passed");
  console.log(`Screenshots: ${artifactDir}`);
}

async function assertVisible(locator, label) {
  await locator.waitFor({ state: "visible", timeout: 10_000 }).catch((error) => {
    throw new Error(`Expected visible ${label}: ${error.message}`);
  });
}

async function assertHidden(locator, label) {
  await locator.waitFor({ state: "hidden", timeout: 2_000 }).catch((error) => {
    throw new Error(`Expected hidden ${label}: ${error.message}`);
  });
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  process.exit(process.exitCode ?? 0);
});

function logStep(label) {
  console.log(`[raw-materials-e2e] ${label}`);
}
