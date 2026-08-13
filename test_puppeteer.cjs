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
  
  // click add task
  await page.evaluate(() => {
    const addTaskBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add New Habit'));
    if (addTaskBtn) addTaskBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  // change the newly created task to daily_sprint
  await page.evaluate(() => {
    const select = Array.from(document.querySelectorAll('select[id^="select-habit-type-"]')).pop(); // last one
    if (select) {
      select.value = 'daily_sprint';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  // check if it's still there
  const tasksAfter = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input[placeholder="Habit name"]')).map(el => el.value);
  });
  console.log("Tasks after:", tasksAfter);
  
  await browser.close();
})();
