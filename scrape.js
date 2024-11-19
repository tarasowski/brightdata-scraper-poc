import { fileURLToPath } from 'url';
import { dirname } from 'path';
import puppeteer from "puppeteer-core";
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BROWSER_WS_ENDPOINT = process.env.BROWSER_WS_ENDPOINT;

export async function scrapeWebsite(domain){
  const BROWSER_WS = BROWSER_WS_ENDPOINT;
  console.log({ domain })
  try {
    console.log('Connecting to Scraping Browser...');
    const browser = await puppeteer.connect({
      browserWSEndpoint: BROWSER_WS,
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    // Handle requests
    page.on('request', (request) => {
      if (request.resourceType() === 'document') {
        request.continue();
      } else {
        request.abort();
      }
    });
    await page.goto(`https://${domain}`, { waitUntil: 'domcontentloaded' });
    //const html = await page.content();
    //const body = await page.evaluate(() => document.body.innerHTML);
    const text = await page.evaluate(() => document.body.innerText);
    await browser.close();
    return text;
  } catch (error) {
    console.log(error)
    process.exit(1)
    return "<html><body>Failed to scrape website</body></html>"
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // This is the main module
  scrapeWebsite("www.travelandleisure.com/best-hotels-in-copenhagen-8637025")
  .then((res) => {
    console.log(res)
    fs.writeFileSync('output.txt', res);
    console.log('Scraping completed');
  })
  .catch((error) => {
    console.error('Scraping failed:', error);
  });
} /*else {
  // This module was imported by another module
  console.log('This script was imported by another module');
}*/
