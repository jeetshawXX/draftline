import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const baseURL = (
  process.env.SITE_URL ||
  "https://draftlinejeet.vercel.app/"
).replace(/\/+$/, "");

const screenshotDir = path.resolve("screenshots");
fs.mkdirSync(screenshotDir, { recursive: true });

const rl = readline.createInterface({ input, output });

try {
  const email = await rl.question("Admin email: ");
  const password = await rl.question("Admin password: ");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });

  try {
    console.log("Opening homepage...");
    await page.goto(baseURL, { waitUntil: "networkidle", timeout: 60000 });
    await page.screenshot({
      path: path.join(screenshotDir, "homepage.png"),
      fullPage: true,
    });

    console.log("Opening admin login...");
    await page.goto(`${baseURL}/admin/login`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill(email);
    await passwordInput.fill(password);

    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes("/admin/login"), {
        timeout: 30000,
      }),
      page.locator('button[type="submit"]').click(),
    ]);

    await page.goto(`${baseURL}/admin`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(screenshotDir, "dashboard.png"),
      fullPage: true,
    });

    console.log("Capturing post editor...");
    await page.goto(`${baseURL}/admin/posts/new`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotDir, "post-editor.png"),
      fullPage: true,
    });

    console.log("Capturing media library...");
    await page.goto(`${baseURL}/admin/media`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(screenshotDir, "media-library.png"),
      fullPage: true,
    });

    console.log("\nScreenshots saved in:", screenshotDir);
    console.log("Review them before adding them to your README.");
  } finally {
    await browser.close();
  }
} catch (error) {
  console.error("Screenshot capture failed:", error.message);
  process.exitCode = 1;
} finally {
  rl.close();
}
