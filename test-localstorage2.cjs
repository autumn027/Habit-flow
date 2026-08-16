const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 1000));
  
  // Check initial state
  let tasks = await page.evaluate(() => localStorage.getItem('habit-tracker-data'));
  console.log("Initial LS:", JSON.parse(tasks).tasks.length);
  
  // click start
  await page.evaluate(() => {
    const btn = document.getElementById('btn-enter-app');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // delete first task
  await page.evaluate(() => {
    const btn = document.getElementById('btn-settings-open');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Find delete button of first task
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (let b of btns) {
      if (b.innerHTML.includes('lucide-trash-2')) {
        b.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  tasks = await page.evaluate(() => localStorage.getItem('habit-tracker-data'));
  console.log("After delete LS:", JSON.parse(tasks).tasks.length);
  
  // Fake import
  await page.evaluate(() => {
    const data = {
      appVersion: "1.2.0",
      data: {
        tasks: [{ name: 'Imported Task 1', type: 'evergreen', startDate: '2026-08-16' }],
        history: {},
        hasStarted: true
      }
    };
    // we can't trigger file input easily, let's call the logic by injecting a fake button
    // wait, we can just inject into localstorage and reload?
    // The user imports via file. 
  });
  
  // Let's create a file and upload it
  const fs = require('fs');
  fs.writeFileSync('test-import.json', JSON.stringify({
      appVersion: "1.2.0",
      data: {
        tasks: [{ name: 'Imported Task 1', type: 'evergreen', startDate: '2026-08-16' }],
        history: {},
        hasStarted: true
      }
  }));
  
  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile('test-import.json');
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Click overwrite
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (let b of btns) {
      if (b.innerText && b.innerText.includes('Replace existing data completely')) {
        b.click();
        break;
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  tasks = await page.evaluate(() => localStorage.getItem('habit-tracker-data'));
  console.log("After import LS:", JSON.parse(tasks).tasks.length);
  console.log("Tasks in LS:", JSON.parse(tasks).tasks.map(t => t.name));
  
  // Reload page
  await page.reload();
  await new Promise(r => setTimeout(r, 1000));
  
  tasks = await page.evaluate(() => localStorage.getItem('habit-tracker-data'));
  console.log("After reload LS:", JSON.parse(tasks).tasks.length);
  console.log("Tasks in LS after reload:", JSON.parse(tasks).tasks.map(t => t.name));

  await browser.close();
})();
