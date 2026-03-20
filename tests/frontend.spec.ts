import { expect, test } from '@playwright/test';
import {
  aboutContent,
  categoryContent,
  contactContent,
  customizationContent,
  homeContent,
  newsContent,
  newsPageContent,
  productContent,
  productsPageContent,
} from './fixtures';

test('首页展示核心业务内容', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: homeContent.hero.title })).toBeVisible();
  await expect(page.getByRole('link', { name: homeContent.hero.primaryLabel })).toBeVisible();
  await expect(page.getByText(homeContent.inquiry.title)).toBeVisible();
});

test('About 页面展示事实区和 FAQ', async ({ page }) => {
  await page.goto('/about-us');
  await expect(page.getByRole('heading', { name: aboutContent.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: aboutContent.factsHeading.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: aboutContent.faqHeading.title })).toBeVisible();
});

test('Customization 页面展示亮点和关联分类', async ({ page }) => {
  await page.goto('/customization');
  await expect(page.getByRole('heading', { name: customizationContent.title, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: customizationContent.highlightsHeading.title })).toBeVisible();
  await expect(page.getByRole('link', { name: /Birthday Candle/i })).toBeVisible();
});

test('Contact 页面展示联系信息与表单引导', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByRole('heading', { name: contactContent.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: contactContent.sections[0]?.title ?? '' })).toBeVisible();
  await expect(page.getByRole('heading', { name: contactContent.cta.title })).toBeVisible();
});

test('Products 聚合页展示分类和扩展选项', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: productsPageContent.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'All Categories' })).toBeVisible();
  await expect(page.getByRole('heading', { name: productsPageContent.customOptions[0]?.title ?? '' })).toBeVisible();
  await expect(page.getByText(productsPageContent.inquiry.title)).toBeVisible();
});

test('分类页展示介绍和 CTA', async ({ page }) => {
  await page.goto('/birthday-candle');
  await expect(page.locator('h1')).toHaveText(categoryContent.title);
  await expect(page.getByRole('heading', { name: categoryContent.introTitle })).toBeVisible();
  await expect(page.getByRole('link', { name: categoryContent.primaryCta.label }).first()).toBeVisible();
});

test('产品详情页展示规格和相关内容', async ({ page }) => {
  await page.goto('/birthday-candle/long-thin-birthday-candles');
  await expect(page.getByRole('heading', { name: productContent.title })).toBeVisible();
  await expect(page.locator('dt', { hasText: productContent.specs[0]?.label ?? '' })).toBeVisible();
  await expect(page.locator('dt', { hasText: productContent.specs[1]?.label ?? '' })).toBeVisible();
});

test('新闻聚合页展示列表和 inquiry', async ({ page }) => {
  await page.goto('/news');
  await expect(page.getByRole('heading', { name: newsPageContent.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'All News' })).toBeVisible();
  await expect(page.getByText(newsPageContent.inquiry.title)).toBeVisible();
});

test('新闻详情页展示正文、相关文章和 inquiry', async ({ page }) => {
  await page.goto('/news/looking-for-global-partners');
  await expect(page.getByRole('heading', { name: newsContent.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Related News' })).toBeVisible();
  await expect(page.getByText(newsContent.inquiry.title)).toBeVisible();
});

test('Keystatic 后台入口可访问', async ({ page }) => {
  await page.goto('/keystatic');
  await expect(page.locator('astro-island')).toHaveCount(1);
});
