import fs from 'fs';
import OpenAI from 'openai';
import dotenv from 'dotenv';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_TOKENS = process.env.MAX_TOKENS

dotenv.config();

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

export async function cleanContent(content) {
  const chatCompletion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
    { role: 'assistant', content: 'You are helpful assistant that will be cleaning the data and bringing it into the right structure' },
    { role: 'user', content: `Extract only main content (no headers, navs, footers, etc.) return the output in plain text: ` + content }
  ],
    model: OPENAI_MODEL,
  });
  return chatCompletion.choices[0].message.content;
}

if (import.meta.url === `file://${process.argv[1]}`) {

  const file = fs.readFileSync('output.txt', 'utf8');
  const parts = file.slice(file.length - 1000, file.length)
  console.log(parts)
  cleanContent(parts).then((res) => console.log(res))
        .catch((error) => console.error('Scraping failed:', error));
  console.log("This script is not meant to be run directly")
} 
