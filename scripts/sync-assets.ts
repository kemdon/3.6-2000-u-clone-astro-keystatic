import { cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceDir = path.join(root, 'clone', 'resources', 'www.birthdaycakecandle.com');
const targetDir = path.join(root, 'public', 'images', 'source');

await mkdir(targetDir, { recursive: true });

const files = await readdir(sourceDir);
await Promise.all(
  files.map((file) =>
    cp(path.join(sourceDir, file), path.join(targetDir, file), {
      force: true,
    })
  )
);

console.log(`Synced ${files.length} assets to public/images/source`);
