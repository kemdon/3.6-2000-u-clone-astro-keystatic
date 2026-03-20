import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { reader } from './keystatic';

const contentRoot = path.join(process.cwd(), 'content');

type NestedRecord<T = any> = { slug: string; entry: T };

async function readNestedCollection<T = any>(dirName: string, readEntry: (slug: string) => Promise<T | null>) {
  const dirPath = path.join(contentRoot, dirName);
  const names = await readdir(dirPath, { withFileTypes: true });
  const slugs = names.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const items = await Promise.all(
    slugs.map(async (slug) => {
      const entry = await readEntry(slug);
      return entry ? { slug, entry } : null;
    })
  );
  return items.filter(Boolean) as Array<NestedRecord<NonNullable<T>>>;
}

export async function getSite() {
  return reader.singletons.site.readOrThrow();
}

export async function getNavigation() {
  return reader.singletons.navigation.readOrThrow();
}

export async function getHome() {
  return reader.singletons.home.readOrThrow();
}

export async function getNewsPage() {
  return reader.singletons.newsPage.readOrThrow();
}

export async function getProductsPage() {
  return reader.singletons.productsPage.readOrThrow();
}

export async function getPages() {
  return readNestedCollection('pages', (slug) => reader.collections.pages.read(slug));
}

export async function getPageBySlug(slug: string) {
  return reader.collections.pages.read(slug);
}

export async function getCategories() {
  const items = await reader.collections.productCategories.all();
  return items.sort((a, b) => (a.entry.sortOrder ?? 0) - (b.entry.sortOrder ?? 0));
}

export async function getCategoryBySlug(slug: string) {
  return reader.collections.productCategories.read(slug);
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
  return readNestedCollection('products', (slug) => reader.collections.products.read(slug));
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
  const items = await readNestedCollection('news', (slug) => reader.collections.news.read(slug));
  return items.sort((a, b) => `${b.entry.publishedAt}`.localeCompare(`${a.entry.publishedAt}`));
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
