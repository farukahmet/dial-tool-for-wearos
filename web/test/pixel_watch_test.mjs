import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(__dirname, "../package.json"));
const { chromium } = require("playwright");

console.log("Testing Pixel Watch bezel and strap toggle in browser...");
let browser;
try {
  browser = await chromium.launch({ channel: "msedge" });
} catch {
  browser = await chromium.launch();
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

const htmlPath = path.resolve(__dirname, "../dial-tool.html");
await page.goto("file:///" + htmlPath.replace(/\\/g, "/"));
await page.waitForFunction(() => window.dial_tool && window.dial_tool.svg, null, { timeout: 20000 });
await page.waitForTimeout(500);

// Select Pixel Watch (option value "5")
await page.selectOption("#case-pick", "5");
await page.waitForTimeout(200);

// Check Case box text and state
const caseWord = await page.textContent("#case .word");
console.log(`✓ Case label: "${caseWord}"`);
if (caseWord !== "Pixel Watch") throw new Error(`Expected "Pixel Watch", got "${caseWord}"`);

// Verify Strap button is now visible
const strapVisible = await page.isVisible("#strap");
console.log(`✓ Strap toggle visible: ${strapVisible}`);
if (!strapVisible) throw new Error("Strap toggle should be visible when Pixel Watch is selected");

// 1. Test "No strap" (value "0")
await page.selectOption("#strap-pick", "0");
await page.waitForTimeout(200);

const hasBack = await page.evaluate(() => Boolean(document.querySelector(".pw-case-back")));
const hasFront = await page.evaluate(() => Boolean(document.querySelector(".pw-case-front")));
const hasBandNoStrap = await page.evaluate(() => Boolean(document.querySelector(".pw-case-back path[fill='url(#pw-band-h)']")));

console.log(`✓ Case back present: ${hasBack}, Case front dome present: ${hasFront}`);
console.log(`✓ Active Band present when "No strap" selected: ${hasBandNoStrap}`);
if (!hasBack || !hasFront) throw new Error("Pixel Watch back or front missing!");
if (hasBandNoStrap) throw new Error("Active Band should NOT be rendered when strap is 0 (None)!");

// Screenshot No Strap
const artDir = "C:/Users/faruk/.gemini/antigravity/brain/6d4c3a50-d1d4-4b7f-ab33-fee2611035c4";
await page.screenshot({ path: path.join(artDir, "pixel_watch_no_strap.png") });
console.log("✓ Saved screenshot: pixel_watch_no_strap.png");

// 2. Test "Strap" (value "1" - Active Band)
await page.selectOption("#strap-pick", "1");
await page.waitForTimeout(200);

const hasBandWithStrap = await page.evaluate(() => Boolean(document.querySelector(".pw-case-back path[fill='url(#pw-band-h)']")));
const dotVisible = await page.isVisible("#strap-colour");
console.log(`✓ Active Band present when "Strap" selected: ${hasBandWithStrap}`);
console.log(`✓ Strap color dot visible: ${dotVisible}`);
if (!hasBandWithStrap) throw new Error("Active Band should be rendered when strap is 1!");
if (!dotVisible) throw new Error("Strap color dot should be visible for custom coloring!");

// Screenshot with Default Strap
await page.screenshot({ path: path.join(artDir, "pixel_watch_active_band.png") });
console.log("✓ Saved screenshot: pixel_watch_active_band.png");

// 3. Test Custom Color (Bay Blue)
await page.evaluate(() => {
  window.dial_tool.set_value("global", "c_strap", [0.35, 0.52, 0.65, 1]); // Bay Blue
  window.dial_tool.render();
});
await page.waitForTimeout(200);

await page.screenshot({ path: path.join(artDir, "pixel_watch_bay_blue_band.png") });
console.log("✓ Saved screenshot: pixel_watch_bay_blue_band.png");

if (errors.length > 0) {
  throw new Error("Browser errors: " + errors.join(", "));
}

console.log("All Pixel Watch tests passed successfully!");
await browser.close();
