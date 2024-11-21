// notes
// remove the script tags 
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
    const body = await page.evaluate(() => {

      // Remove all HTML comments from the document
      const comments = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT, null, false);
      let comment = comments.nextNode();
      while (comment) {
        comment.remove(); // Remove the comment node
        comment = comments.nextNode();
      }

      // Remove all <script> elements from the DOM
      document.querySelectorAll('script').forEach(script => script.remove());
      document.querySelectorAll('noscript').forEach(script => script.remove());
      document.querySelectorAll('svg').forEach(script => script.remove());
      document.querySelectorAll('button').forEach(script => script.remove());
      document.querySelectorAll('footer').forEach(script => script.remove());
      document.querySelectorAll('nav').forEach(script => script.remove());
      document.querySelectorAll('header').forEach(script => script.remove());

       document.querySelectorAll('*').forEach(el => {
        // Remove `id` if it doesn't match the allowed keywords
        if (el.id && !/nav|footer|navigation|header/i.test(el.id)) {
          el.removeAttribute('id');
        }
        // Remove `class` if it doesn't match the allowed keywords
        if (el.className && !/nav|footer|navigation|header/i.test(el.className)) {
          el.removeAttribute('class');
        }
      });
       document.querySelectorAll('img').forEach(img => img.removeAttribute('src'));

      document.querySelectorAll('*').forEach(el => {
        // Remove all attributes except id and class
        [...el.attributes].forEach(attr => {
          if (!['id', 'class'].includes(attr.name)) {
            el.removeAttribute(attr.name);
          }
        });

        // Remove element if it is empty (no text and no children)
        if (el.textContent.trim() === '' && el.children.length === 0) {
          el.remove();
        }
      });

      // Return the body HTML without <script> tags and stripped attributes
      return document.body.innerHTML;
      return document.body.innerHTML;
    });
    //const text = await page.evaluate(() => document.body.innerText);
    await browser.close();
    return body
  } catch (error) {
    console.log(error)
    process.exit(1)
    return "<html><body>Failed to scrape website</body></html>"
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // This is the main module
  // https://www.cntraveler.com/gallery/best-copenhagen-hotels
// https://www.cntraveller.com/gallery/copenhagen-hotels
// https://www.tripadvisor.com/Hotels-g189541-Copenhagen_Zealand-Hotels.html
// https://www.telegraph.co.uk/travel/destinations/europe/denmark/copenhagen/hotels/
// https://www.travelandleisure.com/best-hotels-in-copenhagen-8637025
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
