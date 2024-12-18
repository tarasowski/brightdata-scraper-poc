// notes
// remove the script tags 
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import puppeteer from "puppeteer-core";
import dotenv from 'dotenv';
import { cleanContent } from "./clean.js";
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BROWSER_WS_ENDPOINT = process.env.BROWSER_WS_ENDPOINT;

export async function scrapeWebsite(domain){
  const BROWSER_WS = BROWSER_WS_ENDPOINT;

  try {
    console.log('Connecting to Scraping Browser...');

    console.time('Connecting Time');
    const browser = await puppeteer.connect({
      browserWSEndpoint: BROWSER_WS,
    });
    console.timeEnd('Connecting Time');

    console.time("Opening Page");
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', (request) => {
      const allowedResources = ['document', 'script', 'xhr', 'fetch'];
      if (allowedResources.includes(request.resourceType())) {
        request.continue();
      } else {
        request.abort();
      }
    });

    await page.goto(`https://${domain}`, { waitUntil: 'domcontentloaded' });

    console.timeEnd("Opening Page");

    console.time("Cleaning content");
    const body = await page.evaluate(() => {

      const countWords = (text) => {
        return text.split(/\s+/).filter(word => word.trim().length > 0).length;
      };

      const wordCount = countWords(document.body.innerText || "");
      const headlineCount = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
      const paragraphCount = document.querySelectorAll('p').length;
      const imageCount = document.querySelectorAll('img').length;
  

      // Remove all HTML comments from the document
      const comments = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT, null, false);
      let comment = comments.nextNode();
      while (comment) {
        comment.remove(); // Remove the comment node
        comment = comments.nextNode();
      }

      document.querySelectorAll('script').forEach(elem => elem.remove());
      document.querySelectorAll('noscript').forEach(elem => elem.remove());
      document.querySelectorAll('svg').forEach(elem => elem.remove());
      document.querySelectorAll('button').forEach(elem => elem.remove());
      document.querySelectorAll('footer').forEach(elem => elem.remove());
      document.querySelectorAll('nav').forEach(elem => elem.remove());
      document.querySelectorAll('header').forEach(elem => elem.remove());


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
        // Remove element if it is empty (no text and no children)
        if (el.textContent.trim() === '' && el.children.length === 0) {
          el.remove();
        }
      });

      let html = document.body.innerHTML;
      // Remove all newlines, carriage returns, and extra spaces between elements
      html = html.replace(/(\r\n|\n|\r)/g, '');  // Remove all newlines and carriage returns
      html = html.replace(/\s{2,}/g, ' ');  // Replace multiple spaces with a single space

      // Regex to transform opening tags (<div>, <p>, etc.) while preserving attributes
      html = html.replace(/<(\w+)([^>]*)>/g, (match, p1, p2) => {
        // Replace the tag name with a space-saving format (< tag_name id="...">)
        if (p1.startsWith('h')) {
          // Don't transform <h1>, <h2>, ..., <h6> tags, leave them as is
          return `<${p1}${p2}>`;
        }
        // Replace other tags with their simplified form, preserving their attributes
        return `<${p2}>`;
      });

      // Regex to transform closing tags (</div>, </p>, etc.)
      html = html.replace(/<\/(\w+)>/g, (match, p1) => {
        // Replace closing tags with </>
        if (p1.startsWith('h')) {
          // Don't transform closing h tags, leave them as is
          return `</${p1}>`;
        }
        return `</>`;
      });

      // Step 2: Collapse consecutive empty opening tags "<>" into one "<>"
      html = html.replace(/(<\s*>\s*)+/g, '<>'); // Match multiple consecutive empty opening tags and replace with a single "<>"

      // Step 3: Collapse consecutive empty closing tags "</>" into one "</>"
      html = html.replace(/(<\/\s*>\s*)+/g, '</>'); // Match multiple consecutive empty closing tags and replace with a single "</>"

      // Step 4: Remove the exact pattern "<></>" (empty opening and closing tags)
      html = html.replace(/<\s*>\s*<\/\s*>/g, ''); // Remove exact pattern "<></>"

       // Step 1: Remove all HTML comments
      html = html.replace(/<!--[\s\S]*?-->/g, ''); // Match and remove all HTML comments

      html = html.replace(/(id=")([^"]+)(")/g, (match, p1, p2, p3) => {
        // Define allowed keywords for 'id'
        console.log(p2.split(/\s+/))
        const allowedWords = ['nav', 'footer', 'navigation', 'header'];
        const filteredWords = allowedWords.filter(word => p2.includes(word))

        if (filteredWords.length > 0) {
          // If any allowed word is found, replace the entire id attribute with that word
          return p1 + filteredWords[0] + p3;
        } else {
          // Otherwise, leave the id attribute as is
          return match;
        }
      });

      html = html.replace(/(class=")([^"]+)(")/g, (match, p1, p2, p3) => {
        // Define allowed keywords for 'id'
        console.log(p2.split(/\s+/))
        const allowedWords = ['nav', 'footer', 'navigation', 'header'];
        const filteredWords = allowedWords.filter(word => p2.includes(word))

        if (filteredWords.length > 0) {
          // If any allowed word is found, replace the entire id attribute with that word
          return p1 + filteredWords[0] + p3;
        } else {
          // Otherwise, leave the id attribute as is
          return match;
        }
      });
      
      // Return the body HTML without <script> tags and stripped attributes
      return {
        result: true,
        word_count: wordCount,
        headline_count: headlineCount,
        paragraph_count: paragraphCount,
        image_count: imageCount,
        content: html,
        url: window.location.href,
      }
    });
    console.timeEnd("Cleaning content");
    await browser.close();
    console.time("Cleaning content");
    const { content, ...rest } = body;
    const cleanedContent = await cleanContent(content);
    console.timeEnd("Cleaning content");
    return {
      content: cleanedContent,
      ...rest
      }
  } catch (error) {
    console.log(error)
    return {
      result: false,
      word_count: 0,
      headline_count: 0,
      paragraph_count: 0,
      image_count: 0,
      content: '',
      url: '',
    }
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
    //fs.writeFileSync('output.txt', res);
    console.log('Scraping completed');
  })
  .catch((error) => {
    console.error('Scraping failed:', error);
  });
} /*else {
  // This module was imported by another module
  console.log('This script was imported by another module');
}*/
