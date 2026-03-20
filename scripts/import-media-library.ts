import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const contentDir = path.join(rootDir, 'content');
const mediaDir = path.join(contentDir, 'mediaLibrary');
const publicDir = path.join(rootDir, 'public');
const mediaPublicDir = path.join(publicDir, 'uploads', 'images', 'library');

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type MediaRecord = {
  slug: string;
  src: string;
  targetPublicPath: string;
  targetFilePath: string;
  title: string;
  alt: string;
  description: string;
};

const mediaBySrc = new Map<string, MediaRecord>();
const missingFiles: string[] = [];
const updatedFiles: string[] = [];

function sanitizeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'media';
}

function toTitle(input: string) {
  return input
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || 'Imported Media';
}

function normalizeMediaTitle(candidate: string, fallbackSrc = '') {
  const cleaned = candidate
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(?:[a-f0-9]{8,}|j|p|web)\b/gi, '')
    .trim();

  if (cleaned) {
    return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return fallbackSrc ? toTitle(path.basename(fallbackSrc, path.extname(fallbackSrc))) : 'Imported Media';
}

function getOrCreateMediaRecord(src: string, alt = '') {
  const existing = mediaBySrc.get(src);
  if (existing) {
    if (!existing.alt && alt) existing.alt = alt;
    if (alt) {
      existing.title = normalizeMediaTitle(alt, existing.src);
    }
    return existing;
  }

  const fileName = path.basename(src);
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);
  const hash = createHash('md5').update(src).digest('hex').slice(0, 8);
  const slug = `${sanitizeSlug(baseName)}-${hash}`;
  const targetFileName = `${slug}${ext}`;
  const record: MediaRecord = {
    slug,
    src,
    targetPublicPath: `/uploads/images/library/${targetFileName}`,
    targetFilePath: path.join(mediaPublicDir, targetFileName),
    title: normalizeMediaTitle(alt, src || baseName),
    alt,
    description: `Imported from ${src}`,
  };
  mediaBySrc.set(src, record);
  return record;
}

function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function shouldImportImageSrc(src: string) {
  return src.startsWith('/') && !src.startsWith('//') && !src.startsWith('/uploads/files/');
}

function walkAndRewrite(node: JsonValue): JsonValue {
  if (Array.isArray(node)) {
    return node.map((item) => walkAndRewrite(item));
  }

  if (!isRecord(node)) {
    return node;
  }

  for (const [key, value] of Object.entries(node)) {
    node[key] = walkAndRewrite(value);
  }

  const imageSrc = typeof node.src === 'string' ? node.src : null;
  const isImageObject = imageSrc !== null;
  if (isImageObject && shouldImportImageSrc(imageSrc)) {
    const media = getOrCreateMediaRecord(imageSrc, typeof node.alt === 'string' ? node.alt : '');
    node.media = media.slug;
    node.src = '';
    return node;
  }

  const imageBlockSrc = typeof node.image === 'string' ? node.image : null;
  const isImageBlock = node.type === 'image' && imageBlockSrc !== null;
  if (isImageBlock && shouldImportImageSrc(imageBlockSrc)) {
    const media = getOrCreateMediaRecord(imageBlockSrc, typeof node.imageAlt === 'string' ? node.imageAlt : '');
    node.media = media.slug;
    node.image = '';
    return node;
  }

  return node;
}

async function collectJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (fullPath === mediaDir) return [];
        return collectJsonFiles(fullPath);
      }
      return entry.name.endsWith('.json') ? [fullPath] : [];
    })
  );
  return files.flat();
}

async function ensureMediaFiles() {
  await mkdir(mediaDir, { recursive: true });
  await mkdir(mediaPublicDir, { recursive: true });
}

async function writeMediaEntries() {
  for (const media of mediaBySrc.values()) {
    const sourceFilePath = path.join(publicDir, media.src.replace(/^\//, ''));
    if (!existsSync(sourceFilePath)) {
      missingFiles.push(media.src);
      continue;
    }

    if (!existsSync(media.targetFilePath)) {
      await cp(sourceFilePath, media.targetFilePath);
    }

    const entryPath = path.join(mediaDir, `${media.slug}.json`);
    const entry = {
      title: media.title,
      slug: media.slug,
      assetType: 'image',
      image: media.targetPublicPath,
      file: '',
      previewImage: media.targetPublicPath,
      alt: media.alt,
      description: media.description,
    };
    await writeFile(entryPath, `${JSON.stringify(entry, null, 2)}\n`, 'utf8');
  }
}

async function refreshExistingMediaEntries() {
  const entries = await readdir(mediaDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json') || entry.name === '.gitkeep') continue;
    const entryPath = path.join(mediaDir, entry.name);
    const raw = await readFile(entryPath, 'utf8');
    const item = JSON.parse(raw) as {
      title?: string;
      image?: string;
      alt?: string;
      description?: string;
    };
    const importedFrom = item.description?.replace(/^Imported from\s+/i, '').trim() || '';
    const nextTitle = normalizeMediaTitle(item.alt || item.title || '', importedFrom || item.image || '');
    if (nextTitle !== item.title) {
      item.title = nextTitle;
      await writeFile(entryPath, `${JSON.stringify(item, null, 2)}\n`, 'utf8');
    }
  }
}

async function main() {
  await ensureMediaFiles();
  const jsonFiles = await collectJsonFiles(contentDir);

  for (const filePath of jsonFiles) {
    const raw = await readFile(filePath, 'utf8');
    const original = JSON.parse(raw) as JsonValue;
    const updated = walkAndRewrite(original);
    const serialized = `${JSON.stringify(updated, null, 2)}\n`;
    if (serialized !== raw) {
      await writeFile(filePath, serialized, 'utf8');
      updatedFiles.push(path.relative(rootDir, filePath));
    }
  }

  await writeMediaEntries();
  await refreshExistingMediaEntries();

  console.log(`Updated content files: ${updatedFiles.length}`);
  console.log(`Imported media entries: ${mediaBySrc.size - missingFiles.length}`);
  console.log(`Missing source files: ${missingFiles.length}`);

  if (missingFiles.length) {
    console.log('Missing paths:');
    for (const file of missingFiles) console.log(`- ${file}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
