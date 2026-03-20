import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4510);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const serverDir = path.join(root, 'dist', 'server');
const entryPath = path.join(serverDir, 'entry.mjs');
const testEntryPath = path.join(serverDir, 'entry.playwright.mjs');

const source = await fs.readFile(entryPath, 'utf8');
const patched = source
  .replace('"host": false,', `"host": "${host}",`)
  .replace('"port": 4321,', `"port": ${port},`);

await fs.writeFile(testEntryPath, patched, 'utf8');
await import(`${pathToFileURL(testEntryPath).href}?t=${Date.now()}`);

console.log(`Playwright server running at http://${host}:${port}`);

await new Promise(() => {});
