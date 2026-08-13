const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    const btn = document.getElementById('btn-enter-app');
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const btn = document.getElementById('btn-settings-open');
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const hasChill = await page.evaluate(() => {
    return document.body.innerHTML.includes('Chill day');
  });
  console.log("hasChill?", hasChill);
  
  await browser.close();
})();
