const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generate() {
  const reportIndex = path.join(__dirname, '..', 'playwright-report', 'index.html');
  if (!fs.existsSync(reportIndex)) {
    console.error('Playwright HTML report not found at', reportIndex);
    process.exit(1);
  }

  const outDir = path.join(__dirname, '..', 'Test Results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'playwright-test-results.pdf');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + reportIndex, { waitUntil: 'networkidle' });
  // Give the report a moment to render any dynamic content
  await page.waitForTimeout(500);
  await page.pdf({ path: outFile, format: 'A4', printBackground: true });
  await browser.close();

  console.log('Saved Playwright PDF report to', outFile);
}

generate().catch(err => { console.error(err); process.exit(2); });
