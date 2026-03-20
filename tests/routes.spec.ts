import { expect, test } from '@playwright/test';
import { getCriticalRoutes } from './fixtures';

for (const route of getCriticalRoutes()) {
  test(`路由可访问: ${route}`, async ({ request }) => {
    const response = await request.get(route);
    expect(response.ok(), `请求失败: ${route}`).toBeTruthy();

    const contentType = response.headers()['content-type'] ?? '';
    if (!route.startsWith('/images/')) {
      expect(contentType).toContain('text/html');
    }
  });
}

test('关键静态资源可访问', async ({ request }) => {
  const assets = [
    '/images/source/33373eb67955_logo-2-!p.webp',
    '/images/source/40494f75b899_unsplash_78a265wpio4-1-2546-!j.webp',
    '/images/source/155fe83213b5_pexels-olha-ruskykh-6954597-!j.webp',
  ];

  for (const asset of assets) {
    const response = await request.get(asset);
    expect(response.ok(), `资源失败: ${asset}`).toBeTruthy();
  }
});
