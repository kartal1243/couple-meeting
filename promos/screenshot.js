const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 2160, height: 2160, deviceScaleFactor: 1 });
  
  const filePath = path.join(__dirname, 'instagram-post-4k.html');
  await page.goto('file:///' + filePath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  
  await page.screenshot({
    path: path.join(__dirname, 'instagram-post-4k.png'),
    type: 'png',
    clip: { x: 0, y: 0, width: 2160, height: 2160 }
  });
  
  console.log('4K Instagram post saved: instagram-post-4k.png (2160x2160)');
  await browser.close();
})();
