type MediaEntry = {
  title?: string;
  assetType?: string;
  image?: string | null;
  file?: string | null;
  previewImage?: string | null;
  alt?: string | null;
  description?: string | null;
};

const siteModule = import.meta.glob('../../content/settings/site.json', { eager: true, import: 'default' }) as Record<string, any>;
const navigationModule = import.meta.glob('../../content/navigation/main.json', { eager: true, import: 'default' }) as Record<string, any>;
const homeModule = import.meta.glob('../../content/home/index.json', { eager: true, import: 'default' }) as Record<string, any>;
const newsPageModule = import.meta.glob('../../content/newsPage/index.json', { eager: true, import: 'default' }) as Record<string, any>;
const productsPageModule = import.meta.glob('../../content/productsPage/index.json', { eager: true, import: 'default' }) as Record<string, any>;
const pageModules = import.meta.glob('../../content/pages/*/index.json', { eager: true, import: 'default' }) as Record<string, any>;
const categoryModules = import.meta.glob('../../content/productCategories/*.json', { eager: true, import: 'default' }) as Record<string, any>;
const productModules = import.meta.glob('../../content/products/*/index.json', { eager: true, import: 'default' }) as Record<string, any>;
const newsModules = import.meta.glob('../../content/news/*/index.json', { eager: true, import: 'default' }) as Record<string, any>;
const mediaModules = import.meta.glob('../../content/mediaLibrary/*.json', { eager: true, import: 'default' }) as Record<string, MediaEntry>;

function getSingleton<T>(modules: Record<string, T>) {
  return Object.values(modules)[0];
}

function entriesFromModules<T>(modules: Record<string, T>, mode: 'nested' | 'flat') {
  return Object.entries(modules).map(([filePath, entry]) => ({
    slug:
      mode === 'nested'
        ? filePath.split('/').at(-2) || ''
        : filePath.split('/').at(-1)?.replace(/\.json$/, '') || '',
    entry,
  }));
}

async function getMediaMap() {
  return new Map(entriesFromModules(mediaModules, 'flat').map((item) => [item.slug, item.entry]));
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isImageObject(value: Record<string, any>) {
  return 'src' in value || 'alt' in value || 'media' in value;
}

function isImageBlock(value: Record<string, any>) {
  return value.type === 'image' && ('image' in value || 'media' in value);
}

function resolveImageObject(value: Record<string, any>, mediaMap: Map<string, MediaEntry>) {
  const media = typeof value.media === 'string' && value.media ? mediaMap.get(value.media) : null;
  const resolvedSrc = media?.assetType === 'image' && media.image ? media.image : value.src;
  const resolvedAlt = value.alt || media?.alt || media?.title || '';
  return {
    ...value,
    src: resolvedSrc || '',
    alt: resolvedAlt,
  };
}

function resolveImageBlock(value: Record<string, any>, mediaMap: Map<string, MediaEntry>) {
  const media = typeof value.media === 'string' && value.media ? mediaMap.get(value.media) : null;
  const resolvedImage = media?.assetType === 'image' && media.image ? media.image : value.image;
  const resolvedAlt = value.imageAlt || media?.alt || media?.title || '';
  return {
    ...value,
    image: resolvedImage || '',
    imageAlt: resolvedAlt,
  };
}

function resolveMediaReferences<T>(value: T, mediaMap: Map<string, MediaEntry>): T {
  if (Array.isArray(value)) {
    return value.map((item) => resolveMediaReferences(item, mediaMap)) as T;
  }

  if (!isRecord(value)) {
    return value;
  }

  const resolvedEntries = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, resolveMediaReferences(item, mediaMap)])
  );

  if (isImageBlock(resolvedEntries)) {
    return resolveImageBlock(resolvedEntries, mediaMap) as T;
  }

  if (isImageObject(resolvedEntries)) {
    return resolveImageObject(resolvedEntries, mediaMap) as T;
  }

  return resolvedEntries as T;
}

async function resolveContent<T>(value: T) {
  const mediaMap = await getMediaMap();
  return resolveMediaReferences(value, mediaMap);
}

export async function getSite() {
  return resolveContent(getSingleton(siteModule));
}

export async function getNavigation() {
  return getSingleton(navigationModule);
}

export async function getHome() {
  return resolveContent(getSingleton(homeModule));
}

export async function getNewsPage() {
  return resolveContent(getSingleton(newsPageModule));
}

export async function getProductsPage() {
  return resolveContent(getSingleton(productsPageModule));
}

export async function getPages() {
  const pages = entriesFromModules(pageModules, 'nested');
  return Promise.all(pages.map(async (item) => ({ ...item, entry: await resolveContent(item.entry) })));
}

export async function getPageBySlug(slug: string) {
  const page = entriesFromModules(pageModules, 'nested').find((item) => item.slug === slug)?.entry ?? null;
  return page ? resolveContent(page) : null;
}

export async function getCategories() {
  const items = entriesFromModules(categoryModules, 'flat');
  const resolved = await Promise.all(items.map(async (item) => ({ ...item, entry: await resolveContent(item.entry) })));
  return resolved.sort((a, b) => (a.entry.sortOrder ?? 0) - (b.entry.sortOrder ?? 0));
}

export async function getCategoryBySlug(slug: string) {
  const category = entriesFromModules(categoryModules, 'flat').find((item) => item.slug === slug)?.entry ?? null;
  return category ? resolveContent(category) : null;
}

export async function getCategoryRecordBySlug(slug: string) {
  const categories = await getCategories();
  return categories.find((item) => item.slug === slug) ?? null;
}

export async function getCategoriesBySlugs(slugs: readonly (string | null)[]) {
  const categories = await getCategories();
  return slugs
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => categories.find((item) => item.slug === slug))
    .filter((item): item is Awaited<ReturnType<typeof getCategories>>[number] => Boolean(item));
}

export async function getProducts() {
  const products = entriesFromModules(productModules, 'nested');
  return Promise.all(products.map(async (item) => ({ ...item, entry: await resolveContent(item.entry) })));
}

export async function getProductsByCategory(categorySlug: string) {
  const products = await getProducts();
  return products.filter((item) => item.entry.category === categorySlug);
}

export async function getProductRecordBySlug(categorySlug: string, productSlug: string) {
  const products = await getProducts();
  return products.find((item) => item.slug === productSlug && item.entry.category === categorySlug) ?? null;
}

export async function getNews() {
  const items = entriesFromModules(newsModules, 'nested');
  const resolved = await Promise.all(items.map(async (item) => ({ ...item, entry: await resolveContent(item.entry) })));
  return resolved.sort((a, b) => `${b.entry.publishedAt}`.localeCompare(`${a.entry.publishedAt}`));
}

export async function getNewsBySlugs(slugs: readonly (string | null)[]) {
  const news = await getNews();
  return slugs
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => news.find((item) => item.slug === slug))
    .filter((item): item is Awaited<ReturnType<typeof getNews>>[number] => Boolean(item));
}

export function textToParagraphs(text?: string | null) {
  return (text ?? '')
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}
