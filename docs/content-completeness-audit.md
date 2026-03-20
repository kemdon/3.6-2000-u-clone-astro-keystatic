# 内容完整性审计

审计时间：2026-03-20

## 已对齐到内容模型

### 首页 `/`
- 已导入 Hero、公司介绍、solution 卡片、customization 区、custom options、精选分类、精选产品、精选新闻、页底 inquiry。
- 数据来源：`clone/pages/001_home_85fc8c29/index.html`
- 内容落点：`content/home/index.json`

### 单页 `/about-us`
- 已导入 Hero 文案、公司介绍正文、Business Philosophy / Mission / Vision / Goals、Factory 图库、FAQ、CTA、页底 inquiry。
- 数据来源：`clone/pages/002_about-us_c6df1518/index.html`
- 内容落点：`content/pages/about-us/index.json`

### 单页 `/customization`
- 已导入 Hero 文案、主叙事区、亮点卡片、关联分类、customized tours、CTA、页底 inquiry。
- 数据来源：`clone/pages/014_customization_6ad24f0f/index.html`
- 内容落点：`content/pages/customization/index.json`

### 单页 `/contact`
- 已导入 Hero 文案、联系页主标题、公司名称、地址、邮箱、电话、表单引导 CTA。
- 数据来源：`clone/pages/013_contact_37ab3691/index.html`
- 内容落点：`content/pages/contact/index.json`
- 说明：前台实际表单仍是 Astro 模板层实现，不是 clone 表单原样迁移。

### 新闻列表 `/news`
- 已导入聚合页标题、头图、页底 inquiry。
- 新闻卡片列表仍由 `news` collection 驱动。
- 数据来源：`clone/pages/017_news_4af731c1/index.html`
- 内容落点：`content/newsPage/index.json`

### 新闻详情 `/news/[slug]`
- 已导入正文、摘要、related news、页底 inquiry。
- 数据来源：
  - `clone/pages/018_news_about-business-scope_87308cc8/index.html`
  - `clone/pages/019_news_candle-customize-service_5883e44c/index.html`
  - `clone/pages/020_news_looking-for-global-partne_1d515719/index.html`
- 内容落点：`content/news/*/index.json`

### 产品分类 `/[category]`
- 已导入分类介绍标题、正文、主次 CTA、SEO。
- 数据来源：
  - `clone/pages/003_beeswax-candle_93e57652/index.html`
  - `clone/pages/004_birthday-candle_4d93c2de/index.html`
  - `clone/pages/012_bright-candle_4a09e75d/index.html`
  - `clone/pages/015_dinner-candle_ff6a5194/index.html`
  - `clone/pages/016_jar-candle_6f8b82ee/index.html`
  - `clone/pages/021_others_c809fd19/index.html`
  - `clone/pages/022_pillar-candle_25bd54fd/index.html`
  - `clone/pages/025_scented-candle_774caa0f/index.html`
  - `clone/pages/027_tealight-candle_7e704c93/index.html`
- 内容落点：`content/productCategories/*.json`

### 产品聚合 `/products`
- 已导入聚合页标题、头图、customized tours 扩展区、页底 inquiry。
- 分类主列表仍由 `productCategories` collection 驱动。
- 数据来源：`clone/pages/024_products_20f40695/index.html`
- 内容落点：`content/productsPage/index.json`

### 产品详情 `/[category]/[product]`
- 已导入正文、规格表、摘要、gallery、highlights、SEO。
- 数据来源：各产品详情页 HTML。
- 内容落点：`content/products/*/index.json`

## 已知仍不完整项

### `/privacy-policy`
- clone 源页本身是 `Theme Not Found_404`，没有真实隐私政策正文可恢复。
- 当前内容文件：`content/pages/privacy-policy/index.json`
- 结论：这是源素材缺失，不是导入器漏抓。

### clone 原站的全局浮层与辅助交互
- 包括：侧边分享条、弹窗式 inquiry、cookie banner。
- 当前没有纳入 Keystatic 内容模型。
- 结论：属于运行时交互壳，不属于正式内容主链路，后续如需保真可单独补。

### 聚合页的原站搜索与模板脚本行为
- `/products` 与全站 header 搜索原本依赖原 CMS 的前端脚本。
- 当前没有迁移原脚本行为，仅保留静态内容和结构化列表。
- 结论：这是功能层差异，不是内容丢失。

## 本轮新增内容模型

- `home`
- `pages`
- `productCategories`
- `products`
- `news`
- `newsPage`
- `productsPage`

## 建议的下一轮收尾

1. 如果要继续追高保真，补 `/privacy-policy` 的真实文案来源，否则该页应明确标记为占位页。
2. 如果要继续贴近 clone，可把侧边 inquiry / cookie banner 抽成可选全局模块。
3. 如果要提升后台可编辑性，可把 `contact` 页的表单文案和占位符也纳入 schema。
