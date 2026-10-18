import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(__dirname, "../package.json"));
const { chromium } = require("playwright");

console.log("Testing visualizer canvas navigation gestures...");
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

// Wait a bit for layout to settle
await page.waitForTimeout(500);

// Get SVG bounding box
const svgBox = await page.evaluate(() => {
  const rect = window.dial_tool.svg.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
});

const startX = svgBox.left + svgBox.width / 2;
const startY = svgBox.top + svgBox.height / 2;

// Test 1: LMB Drag should NOT pan canvas
const initialCenter = await page.evaluate(() => window.dial_tool.c.slice());
const initialZoom = await page.evaluate(() => window.dial_tool.z);

await page.mouse.move(startX, startY);
await page.mouse.down({ button: "left" });
await page.mouse.move(startX + 100, startY + 80, { steps: 5 });
await page.mouse.up({ button: "left" });

const afterLmbCenter = await page.evaluate(() => window.dial_tool.c.slice());
if (afterLmbCenter[0] === initialCenter[0] && afterLmbCenter[1] === initialCenter[1]) {
  console.log("✓ LMB drag does NOT pan canvas:", afterLmbCenter);
} else {
  throw new Error(`LMB drag panned canvas! Expected ${initialCenter}, got ${afterLmbCenter}`);
}

// Test 2: MMB (middle mouse button) Drag SHOULD pan canvas
await page.mouse.move(startX, startY);
await page.mouse.down({ button: "middle" });
await page.mouse.move(startX + 100, startY + 80, { steps: 5 });
await page.mouse.up({ button: "middle" });

const afterMmbCenter = await page.evaluate(() => window.dial_tool.c.slice());
if (afterMmbCenter[0] !== initialCenter[0] || afterMmbCenter[1] !== initialCenter[1]) {
  console.log("✓ MMB drag DOES pan canvas:", afterMmbCenter);
} else {
  throw new Error(`MMB drag did NOT pan canvas! Still at ${afterMmbCenter}`);
}

// Test 3: Normal mouse wheel SHOULD zoom
const zoomBeforeWheel = await page.evaluate(() => window.dial_tool.z);
await page.mouse.move(startX, startY);
await page.mouse.wheel(0, -120); // scroll up = zoom in
await page.waitForTimeout(100);

const zoomAfterWheel = await page.evaluate(() => window.dial_tool.z);
if (zoomAfterWheel > zoomBeforeWheel) {
  console.log(`✓ Mouse wheel zooms in (${zoomBeforeWheel.toFixed(3)} -> ${zoomAfterWheel.toFixed(3)})`);
} else {
  throw new Error(`Mouse wheel did NOT zoom in! ${zoomBeforeWheel} -> ${zoomAfterWheel}`);
}

// Test 4: Ctrl/Cmd + wheel SHOULD scroll/pan without changing zoom
const zoomBeforeCtrl = await page.evaluate(() => window.dial_tool.z);
const centerBeforeCtrl = await page.evaluate(() => window.dial_tool.c.slice());

await page.keyboard.down("Control");
await page.mouse.wheel(0, 100);
await page.keyboard.up("Control");
await page.waitForTimeout(100);

const zoomAfterCtrl = await page.evaluate(() => window.dial_tool.z);
const centerAfterCtrl = await page.evaluate(() => window.dial_tool.c.slice());

if (Math.abs(zoomAfterCtrl - zoomBeforeCtrl) < 1e-6) {
  console.log("✓ Ctrl+wheel preserves zoom level:", zoomAfterCtrl.toFixed(3));
} else {
  throw new Error(`Ctrl+wheel altered zoom! ${zoomBeforeCtrl} -> ${zoomAfterCtrl}`);
}

if (centerAfterCtrl[1] !== centerBeforeCtrl[1]) {
  console.log(`✓ Ctrl+wheel scrolled canvas vertically: ${centerBeforeCtrl[1]} -> ${centerAfterCtrl[1]}`);
} else {
  throw new Error(`Ctrl+wheel did NOT scroll canvas vertically! ${centerBeforeCtrl[1]} === ${centerAfterCtrl[1]}`);
}

// Test 5: LMB click (without drag) triggers selection / clicked
let clickedTriggered = false;
await page.evaluate(() => {
  window._testClickedCalled = false;
  const origClicked = window.dial_tool.clicked.bind(window.dial_tool);
  window.dial_tool.clicked = (p, el) => {
    window._testClickedCalled = true;
    return origClicked(p, el);
  };
});

await page.mouse.click(startX, startY);
await page.waitForTimeout(100);

clickedTriggered = await page.evaluate(() => window._testClickedCalled);
if (clickedTriggered) {
  console.log("✓ LMB click (without drag) successfully invokes clicked() handler");
} else {
  throw new Error("LMB click did not invoke clicked() handler!");
}

if (errors.length > 0) {
  throw new Error("Browser errors encountered: " + errors.join(", "));
}

console.log("All canvas navigation gesture tests passed successfully!");
await browser.close();
