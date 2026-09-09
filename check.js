const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');

const PRODUCTS = [
  { key: 'LASSI_PLAIN', label: 'Amul High Protein Plain Lassi (Pack of 30)', url: 'https://shop.amul.com/en/product/amul-high-protein-plain-lassi-200-ml-or-pack-of-30' },
  { key: 'LASSI_ROSE', label: 'Amul High Protein Rose Lassi (Pack of 30)', url: 'https://shop.amul.com/en/product/amul-high-protein-rose-lassi-200-ml-or-pack-of-30' },
];

const NTFY_TOPIC = process.env.NTFY_TOPIC;

function readStatus() {
  const status = {};
  if (fs.existsSync('status.txt')) {
    for (const line of fs.readFileSync('status.txt', 'utf8').split('\n')) {
      const m = line.match(/^(\w+)=(\w+)$/);
      if (m) status[m[1]] = m[2];
    }
  }
  return status;
}

function writeStatus(status) {
  const lines = Object.entries(status).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync('status.txt', lines.join('\n') + '\n');
}

function notify(title, message) {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'ntfy.sh',
        path: '/' + NTFY_TOPIC,
        method: 'POST',
        headers: { Title: title, Priority: 'urgent', Tags: 'rotating_light' },
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      }
    );
    req.on('error', (e) => { console.log('notify error:', e.message); resolve(); });
    req.write(message);
    req.end();
  });
}

(async () => {
  const status = readStatus();
  let changed = false;
  const browser = await chromium.launch();

  for (const p of PRODUCTS) {
    const prev = status[p.key] || 'OUT';
    let newStatus = prev;
    try {
      const page = await browser.newPage();
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      const text = await page.evaluate(() => document.body.innerText);
      const hasSoldOut = /sold out/i.test(text);
      const hasAddCart = /add to cart/i.test(text);
      console.log(`${p.label}: len=${text.length} sold_out=${hasSoldOut} add_to_cart=${hasAddCart}`);

      if (hasSoldOut) {
        newStatus = 'OUT';
      } else if (hasAddCart) {
        newStatus = 'IN';
      } else {
        console.log(`${p.label}: ambiguous rendered content — keeping previous status (${prev}).`);
        newStatus = prev;
      }
      await page.close();
    } catch (e) {
      console.log(`${p.label}: render error: ${e.message} — keeping previous status (${prev}).`);
      newStatus = prev;
    }

    console.log(`${p.label} — previous: ${prev}, new: ${newStatus}`);

    if (newStatus === 'IN' && prev !== 'IN') {
      console.log(`${p.label} went IN STOCK — sending notification.`);
      await notify(`${p.label} IN STOCK`, `${p.label} is in stock. Buy now: ${p.url}`);
    }

    if (newStatus !== prev) {
      status[p.key] = newStatus;
      changed = true;
    }
  }

  await browser.close();
  writeStatus(status);
  fs.writeFileSync('CHANGED_FLAG', changed ? '1' : '0');
})();
