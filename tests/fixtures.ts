import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentRoot = path.join(root, 'content');

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(contentRoot, relativePath), 'utf8')) as T;
}

export function getCategorySlugs() {
  return fs
    .readdirSync(path.join(contentRoot, 'productCategories'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))
    .sort();
}

export function getProductRoutes() {
  const productsDir = path.join(contentRoot, 'products');
  return fs.readdirSync(productsDir).map((slug) => {
    const entry = readJson<{ category: string }>(path.join('products', slug, 'index.json'));
    return `/${entry.category}/${slug}`;
  });
}

export function getNewsRoutes() {
  const newsDir = path.join(contentRoot, 'news');
  return fs.readdirSync(newsDir).map((slug) => `/news/${slug}`);
}

export function getCriticalRoutes() {
  return [
    '/',
    '/about-us',
    '/contact',
    '/customization',
    '/privacy-policy',
    '/products',
    '/news',
    ...getCategorySlugs().map((slug) => `/${slug}`),
    ...getProductRoutes(),
    ...getNewsRoutes(),
    '/keystatic',
  ];
}

export const homeContent = readJson<{
  hero: { title: string; primaryLabel: string };
  inquiry: { title: string };
}>('home/index.json');

export const aboutContent = readJson<{
  title: string;
  factsHeading: { title: string };
  faqHeading: { title: string };
}>('pages/about-us/index.json');

export const customizationContent = readJson<{
  title: string;
  highlightsHeading: { title: string };
  linkedCategorySlugs: string[];
}>('pages/customization/index.json');

export const contactContent = readJson<{
  title: string;
  sections: Array<{ title: string }>;
  cta: { title: string };
}>('pages/contact/index.json');

export const productsPageContent = readJson<{
  title: string;
  customOptions: Array<{ title: string }>;
  inquiry: { title: string };
}>('productsPage/index.json');

export const categoryContent = readJson<{
  title: string;
  introTitle: string;
  primaryCta: { label: string };
}>('productCategories/birthday-candle.json');

export const productContent = readJson<{
  title: string;
  specs: Array<{ label: string }>;
}>('products/long-thin-birthday-candles/index.json');

export const newsPageContent = readJson<{
  title: string;
  inquiry: { title: string };
}>('newsPage/index.json');

export const newsContent = readJson<{
  title: string;
  inquiry: { title: string };
}>('news/looking-for-global-partners/index.json');
