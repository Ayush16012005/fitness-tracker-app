const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const base = 'http://localhost:3000';

  // Go to login
  await page.goto(`${base}/login`);
  await page.fill('#email', 'shlokmaybe@gmail.com');
  await page.fill('#password', 'Shlok@2005');
  await page.click('#login-btn');

  // Wait for potential navigation or for dashboard to load
  await page.waitForTimeout(1000);

  // Navigate to goals page
  await page.goto(`${base}/goals`);

  // Open modal and fill form
  await page.click('#new-goal-btn');
  await page.fill('#goal-title', 'Playwright goal');
  await page.selectOption('#goal-type', 'strength');
  await page.fill('#goal-target', '100');
  await page.fill('#goal-deadline', '2026-12-31');

  // Submit
  await page.click('#goal-form button[type="submit"]');

  // Wait for modal to close or for grid update
  try {
    await page.waitForSelector('#goal-modal', { state: 'hidden', timeout: 3000 });
  } catch {}

  // Check for form error
  let formError = null;
  try {
    formError = await page.textContent('#goal-form-error');
  } catch (e) {}
  console.log('Form error:', formError);

  // Read goals grid
  const goals = await page.$$eval('#goals-grid > *', els => els.map(e => e.innerText));
  console.log('Goals:', goals);

  await browser.close();
})();
