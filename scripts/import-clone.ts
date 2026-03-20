import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type ReconstructionPage = {
  url: string;
  title: string;
  description: string;
  directory: string;
  files: {
    metadata: string;
    resources: string;
  };
};

type ReconstructionIndex = {
  pages: ReconstructionPage[];
};

type ImageValue = { src: string; alt: string };
type LinkValue = { label: string; href: string };

const root = process.cwd();
const contentRoot = path.join(root, 'content');
const reconstruction = JSON.parse(await readFile(path.join(root, 'clone', 'rebuild_prompt_context.json'), 'utf8')) as ReconstructionIndex;

const singlePageSlugs = new Set(['about-us', 'contact', 'customization', 'privacy-policy']);
const reservedSlugs = new Set(['', 'products', 'news', ...singlePageSlugs]);

function getSlugFromUrl(url: string) {
  return new URL(url).pathname.replace(/^\/|\/$/g, '');
}

function getSegments(url: string) {
  return getSlugFromUrl(url).split('/').filter(Boolean);
}

function normalizeImagePath(localPath: string) {
  return `/images/source/${path.basename(localPath)}`;
}

function defaultImage(alt = ''): ImageValue {
  return { src: '', alt };
}

function defaultLink(label = '', href = ''): LinkValue {
  return { label, href };
}

function decodeHtml(text: string) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function htmlToText(html: string) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/[‌]/g, '')
  )
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function matchOne(html: string, pattern: RegExp) {
  return html.match(pattern)?.[1]?.trim() ?? '';
}

function getSection(html: string, startMarker: string, endMarker?: string) {
  const start = html.indexOf(startMarker);
  if (start === -1) return '';
  const end = endMarker ? html.indexOf(endMarker, start) : -1;
  return html.slice(start, end === -1 ? undefined : end);
}

function extractParagraphsFromBlock(block: string) {
  const matches = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  return matches.map((match) => htmlToText(match[1] ?? '')).filter(Boolean);
}

function extractFirstImage(block: string, altIncludes?: string) {
  const matches = [...block.matchAll(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi)];
  const picked =
    (altIncludes ? matches.find((match) => (match[2] ?? '').toLowerCase().includes(altIncludes.toLowerCase())) : undefined) ??
    matches[0];

  return picked
    ? {
        src: normalizeImagePath(picked[1] ?? ''),
        alt: decodeHtml(picked[2] ?? ''),
      }
    : defaultImage();
}

function extractAllImages(block: string) {
  return [...block.matchAll(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi)].map((match) => ({
    src: normalizeImagePath(match[1] ?? ''),
    alt: decodeHtml(match[2] ?? ''),
  }));
}

function extractButton(block: string, classNeedle = 'more') {
  const match =
    block.match(new RegExp(`<a[^>]+class="[^"]*${classNeedle}[^"]*"[^>]*href="([^"]+)"[^>]*>([\\s\\S]*?)<\\/a>`, 'i')) ??
    block.match(new RegExp(`<button[^>]+class="[^"]*${classNeedle}[^"]*"[^>]*>([\\s\\S]*?)<\\/button>`, 'i'));

  if (!match) return defaultLink();
  if (match.length === 3) return { href: normalizeHref(match[1] ?? ''), label: htmlToText(match[2] ?? '') };
  return { href: '/contact', label: htmlToText(match[1] ?? '') };
}

function normalizeHref(href: string) {
  if (!href) return '';
  if (href.startsWith('http')) return new URL(href).pathname || href;
  return href.startsWith('/') ? href : `/${href}`;
}

function extractEntryCards(block: string, classNeedle: string) {
  const pattern = new RegExp(
    `<div class="[^"]*${classNeedle}[^"]*">[\\s\\S]*?<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>[\\s\\S]*?<h3[^>]*class="entry-title"[^>]*>([\\s\\S]*?)<\\/h3>[\\s\\S]*?<div class="entry-text">([\\s\\S]*?)<\\/div>[\\s\\S]*?<\\/div>\\s*<\\/div>`,
    'gi'
  );

  return [...block.matchAll(pattern)].map((match) => ({
    title: htmlToText(match[3] ?? ''),
    description: htmlToText(match[4] ?? ''),
    image: {
      src: normalizeImagePath(match[1] ?? ''),
      alt: decodeHtml(match[2] ?? ''),
    },
  }));
}

function extractFactPairs(block: string) {
  return [...block.matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/gi)].map((match) => ({
    title: htmlToText(match[1] ?? ''),
    description: htmlToText(match[2] ?? ''),
  }));
}

function extractFaqItems(block: string) {
  return [...block.matchAll(/<div class="faq-col">[\s\S]*?<h3 class="entry-title">([\s\S]*?)<\/h3>[\s\S]*?<div class="entry-text">([\s\S]*?)<\/div>/gi)].map((match) => ({
    question: htmlToText(match[1] ?? ''),
    answer: htmlToText(match[2] ?? ''),
  }));
}

function extractTourSections(block: string) {
  return [...block.matchAll(/<div class="item-row tour-row">[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<button[^>]*class="more"[^>]*>([\s\S]*?)<\/button>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi)].map((match) => ({
    eyebrow: 'Customization Options',
    title: htmlToText(match[1] ?? ''),
    description: htmlToText(match[2] ?? ''),
    image: {
      src: normalizeImagePath(match[4] ?? ''),
      alt: decodeHtml(match[5] ?? ''),
    },
    button: {
      label: htmlToText(match[3] ?? '') || 'Contact Us',
      href: '/contact',
    },
  }));
}

function extractCategorySlugs(block: string) {
  return [...new Set([...block.matchAll(/href="https:\/\/www\.birthdaycakecandle\.com\/([^"/?#]+)"/gi)].map((match) => match[1]).filter((slug) => slug && !reservedSlugs.has(slug)))];
}

function extractRelatedNewsSlugs(block: string, currentSlug: string) {
  return [...new Set([...block.matchAll(/href="https:\/\/www\.birthdaycakecandle\.com\/news\/([^"/?#]+)"/gi)].map((match) => match[1]).filter((slug) => slug && slug !== currentSlug))];
}

function extractHeroText(html: string) {
  return htmlToText(matchOne(html, /<div class="inner-content">[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i));
}

function extractInquiry(html: string) {
  const inquirySection = getSection(html, '<div class="inquiry-wrapper', '<footer');
  return {
    title: htmlToText(matchOne(inquirySection, /<div class="inquiry-left">[\s\S]*?<h2>([\s\S]*?)<\/h2>/i)),
    description: htmlToText(matchOne(inquirySection, /<div class="inquiry-left">[\s\S]*?<p>([\s\S]*?)<\/p>/i)),
    buttonLabel: 'Contact Us',
    buttonHref: '/contact',
  };
}

function toSeo(title: string, description: string, image?: string) {
  return {
    title,
    description,
    image: {
      src: image ?? '',
      alt: title,
    },
  };
}

function trimTitle(title: string) {
  return title.replace(/\s*-\s*Sunwing Technology$/i, '');
}

function buildHighlights(text: string) {
  return text
    .split(/\n|[.。]/)
    .map((item) => item.replace(/^[-•\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 4);
}

function firstParagraph(text: string) {
  return text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)[0] ?? '';
}

function parseAboutPage(html: string) {
  const companySection = getSection(html, '<div class="company-wrapper">', '<div class="company-miss">');
  const factsSection = getSection(html, '<div class="company-miss">', '<div class="banner-simple banner-simple-company');
  const ctaSection = getSection(html, '<div class="banner-simple banner-simple-company', '<div class="company-factory">');
  const factorySection = getSection(html, '<div class="company-factory">', '<div class="faq">');
  const faqSection = getSection(html, '<div class="faq">', '<div class="inquiry-wrapper');

  const body = extractParagraphsFromBlock(companySection).join('\n\n');

  return {
    heroText: extractHeroText(html),
    summary: extractHeroText(html) || firstParagraph(body),
    body,
    sections: [
      {
        eyebrow: 'About Us',
        title: htmlToText(matchOne(companySection, /<h2>([\s\S]*?)<\/h2>/i)),
        description: body,
        image: extractFirstImage(companySection, 'about'),
        button: defaultLink(),
      },
    ],
    factsHeading: {
      title: 'Business Philosophy And Vision',
      description: '',
    },
    facts: extractFactPairs(factsSection),
    gallerySection: {
      title: htmlToText(matchOne(factorySection, /<h2>([\s\S]*?)<\/h2>/i)),
      description: extractParagraphsFromBlock(factorySection).join('\n\n'),
    },
    gallery: extractAllImages(factorySection),
    faqHeading: {
      title: 'FAQ',
      description: '',
      image: extractFirstImage(faqSection, 'faq'),
    },
    faq: extractFaqItems(faqSection),
    cta: {
      eyebrow: firstParagraph(htmlToText(matchOne(ctaSection, /<div class="inner-content">([\s\S]*?)<\/div>/i))),
      title: htmlToText(matchOne(ctaSection, /<h2[^>]*>([\s\S]*?)<\/h2>/i)),
      description: extractParagraphsFromBlock(ctaSection).slice(-1)[0] ?? '',
      image: extractFirstImage(ctaSection),
      button: extractButton(ctaSection),
    },
    highlightsHeading: { title: '', description: '' },
    highlights: [],
    linkedCategorySlugs: [],
    inquiry: {
      title: 'Request A Free Quote',
      description: 'Any questions please do not hesitate to contact us. We are happy to provide flexible and reliable solutions.',
    },
  };
}

function parseCustomizationPage(html: string) {
  const mainSection = getSection(html, '<div class="customization">', '<div class="individuation">');
  const highlightSection = getSection(html, '<div class="individuation">', '<div class="home-category">');
  const categorySection = getSection(html, '<div class="home-category">', '<div class="customized-tours">');
  const tourSection = getSection(html, '<div class="customized-tours">', '<div class="inquiry-wrapper">');
  const mainBody = extractParagraphsFromBlock(mainSection).join('\n\n');

  return {
    heroText: extractHeroText(html),
    summary: extractHeroText(html) || firstParagraph(mainBody),
    body: '',
    sections: [
      {
        eyebrow: htmlToText(matchOne(mainSection, /<h4>([\s\S]*?)<\/h4>/i)),
        title: htmlToText(matchOne(mainSection, /<h2>([\s\S]*?)<\/h2>/i)),
        description: mainBody,
        image: extractFirstImage(mainSection, 'customization'),
        button: extractButton(mainSection, 'more'),
      },
      ...extractTourSections(tourSection),
    ],
    highlightsHeading: {
      title: htmlToText(matchOne(highlightSection, /<h2 class="home-title">([\s\S]*?)<\/h2>/i)),
      description: htmlToText(matchOne(highlightSection, /<p class="summary[^"]*">([\s\S]*?)<\/p>/i)),
    },
    highlights: extractEntryCards(highlightSection, 'ind-col'),
    factsHeading: { title: '', description: '' },
    facts: [],
    gallerySection: { title: '', description: '' },
    gallery: [],
    linkedCategorySlugs: extractCategorySlugs(categorySection),
    faqHeading: {
      title: '',
      description: '',
      image: defaultImage(),
    },
    faq: [],
    cta: {
      eyebrow: 'Customized Decorative Pattern Series',
      title: htmlToText(matchOne(categorySection, /<h2 class="home-title[^"]*">([\s\S]*?)<\/h2>/i)),
      description: htmlToText(matchOne(categorySection, /<p class="text-center summary">([\s\S]*?)<\/p>/i)),
      image: extractFirstImage(categorySection),
      button: {
        label: 'Explore Categories',
        href: '/products',
      },
    },
    inquiry: {
      title: 'Need Better Customization Support?',
      description: 'Share your target market, fragrance idea, candle type, and packaging request to start a tailored customization discussion.',
    },
  };
}

function parseContactPage(html: string) {
  const contactSection = getSection(html, '<div class="contact-wrapper">', '<div class="contact-form">');
  const contactBody = [
    htmlToText(matchOne(contactSection, /<h3>([\s\S]*?)<\/h3>/i)),
    ...[...contactSection.matchAll(/<span>([\s\S]*?)<\/span>\s*(?:<p|<a)[^>]*>([\s\S]*?)<\/(?:p|a)>/gi)].map(
      (match) => `${htmlToText(match[1] ?? '')}: ${htmlToText(match[2] ?? '')}`
    ),
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    heroText: extractHeroText(html),
    summary: extractHeroText(html) || firstParagraph(contactBody),
    body: '',
    sections: [
      {
        eyebrow: htmlToText(matchOne(contactSection, /<p class="sub-title">([\s\S]*?)<\/p>/i)),
        title: htmlToText(matchOne(contactSection, /<h2>([\s\S]*?)<\/h2>/i)),
        description: contactBody,
        image: defaultImage('Contact'),
        button: {
          label: 'Email Us',
          href: '/contact',
        },
      },
    ],
    highlightsHeading: { title: '', description: '' },
    highlights: [],
    factsHeading: { title: '', description: '' },
    facts: [],
    gallerySection: { title: '', description: '' },
    gallery: [],
    linkedCategorySlugs: [],
    faqHeading: { title: '', description: '', image: defaultImage() },
    faq: [],
    cta: {
      eyebrow: 'Inquiry Form',
      title: htmlToText(matchOne(html, /<div class="contact-form">[\s\S]*?<h3>([\s\S]*?)<\/h3>/i)),
      description: 'Leave your requirements, company information, and candle needs to start the discussion.',
      image: defaultImage('Contact form'),
      button: {
        label: 'Start Inquiry',
        href: '/contact',
      },
    },
    inquiry: {
      title: '',
      description: '',
    },
  };
}

function parseGenericPage(html: string, title: string) {
  const contentBlock =
    matchOne(html, /<section class="content-wrapper[^"]*">([\s\S]*?)<\/section>/i) ||
    matchOne(html, /<div class="content-wrapper[^"]*">([\s\S]*?)<\/div>\s*<\/div>/i) ||
    getSection(html, '<div class="main-container">', '<footer');
  const body = htmlToText(contentBlock);

  return {
    heroText: extractHeroText(html),
    summary: extractHeroText(html) || firstParagraph(body),
    body,
    sections: [],
    highlightsHeading: { title: '', description: '' },
    highlights: [],
    factsHeading: { title: '', description: '' },
    facts: [],
    gallerySection: { title: '', description: '' },
    gallery: [],
    linkedCategorySlugs: [],
    faqHeading: { title: '', description: '', image: defaultImage() },
    faq: [],
    cta: {
      eyebrow: '',
      title: '',
      description: '',
      image: defaultImage(title),
      button: defaultLink(),
    },
    inquiry: { title: '', description: '' },
  };
}

function parseNewsPage(html: string, currentSlug: string) {
  const contentSection = getSection(html, '<section class="content-wrapper article"', '<div class="recommend-new">');
  const relatedSection = getSection(html, '<div class="recommend-new">', '<div class="inquiry-wrapper">');
  const body = htmlToText(contentSection);
  const inquiry = extractInquiry(html);

  return {
    summary: firstParagraph(body),
    body,
    relatedNewsSlugs: extractRelatedNewsSlugs(relatedSection, currentSlug),
    inquiry,
  };
}

function parseCategoryPage(html: string) {
  const introSection = getSection(html, '<div class="product-wrapper">', '<div class="product">');
  const introBody = extractParagraphsFromBlock(introSection).join('\n\n');
  const buttonMatches = [...introSection.matchAll(/<(a|button)[^>]+class="more"[^>]*?(?:href="([^"]+)")?[^>]*>([\s\S]*?)<\/\1>/gi)];

  const primary = buttonMatches[0]
    ? { label: htmlToText(buttonMatches[0][3] ?? ''), href: normalizeHref(buttonMatches[0][2] ?? '/contact') || '/contact' }
    : defaultLink('Send Inquiry', '/contact');
  const secondary = buttonMatches[1]
    ? { label: htmlToText(buttonMatches[1][3] ?? ''), href: normalizeHref(buttonMatches[1][2] ?? '/products') || '/products' }
    : defaultLink('Learn Our Customization', '/products');

  return {
    summary: firstParagraph(introBody),
    introTitle: htmlToText(matchOne(introSection, /<h2[^>]*>([\s\S]*?)<\/h2>/i)),
    introBody,
    primaryCta: primary,
    secondaryCta: secondary,
  };
}

function parseNewsIndexPage(html: string) {
  const inquiry = extractInquiry(html);
  return {
    title: htmlToText(matchOne(html, /<div class="banner-nav">[\s\S]*?<h1 class="title">([\s\S]*?)<\/h1>/i)) || 'News',
    summary: '',
    inquiry,
  };
}

function parseProductsIndexPage(html: string) {
  const tourSection = getSection(html, '<div class="customized-tours">', '<div class="inquiry-wrapper">');
  const inquiry = extractInquiry(html);

  return {
    title: htmlToText(matchOne(html, /<div class="banner-nav">[\s\S]*?<h1 class="title">([\s\S]*?)<\/h1>/i)) || 'Products',
    summary: '',
    customOptionsHeading: {
      title: htmlToText(matchOne(tourSection, /<h2 class="home-title">([\s\S]*?)<\/h2>/i)),
      description: htmlToText(matchOne(tourSection, /<p class="summary">([\s\S]*?)<\/p>/i)),
    },
    customOptions: extractTourSections(tourSection).map((item) => ({
      title: item.title,
      description: item.description,
      image: item.image,
      buttonLabel: item.button.label,
      buttonHref: item.button.href,
    })),
    inquiry,
  };
}

async function readJson<T>(filePath: string) {
  return JSON.parse(await readFile(path.join(root, 'clone', filePath), 'utf8')) as T;
}

async function readPageHtml(page: ReconstructionPage) {
  return readFile(path.join(root, 'clone', 'pages', page.directory, 'index.html'), 'utf8');
}

async function writeJson(relativePath: string, value: unknown) {
  const filePath = path.join(contentRoot, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function getPageImages(page: ReconstructionPage) {
  const resources = await readJson<{ downloaded_url_to_local?: Record<string, string> }>(page.files.resources);
  const locals = Object.values(resources.downloaded_url_to_local ?? {})
    .filter((item) => /\.(png|jpe?g|webp|svg|ico)$/i.test(item))
    .filter((item) => !/(logo|icon)/i.test(item))
    .map((item) => normalizeImagePath(item));
  return [...new Set(locals)];
}

function parseProductSpecs(html: string) {
  const paramBlock = matchOne(html, /<dl class="product-param">([\s\S]*?)<\/dl>/i);
  const tokens = [...paramBlock.matchAll(/<(dt|dd)[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => htmlToText(match[2] ?? ''));
  const specs: Array<{ label: string; value: string }> = [];

  for (let index = 0; index < tokens.length; index += 2) {
    const label = tokens[index];
    const value = tokens[index + 1];
    if (label && value) specs.push({ label, value });
  }

  return specs;
}

function parseProductBody(html: string) {
  const bodyBlock = matchOne(html, /id="product-content"[\s\S]*?<div class="content-wrapper product">([\s\S]*?)<\/div>\s*<\/div>/i);
  return htmlToText(bodyBlock);
}

function parseHomeContent(html: string) {
  const companySection = getSection(html, '<div class="home-company">', '<div class="home-products">');
  const solutionSection = getSection(html, '<div class="home-solution">', '<div class="home-oem">');
  const customizationSection = getSection(html, '<div class="home-oem">', '<div class="home-custom">');
  const customOptionsSection = getSection(html, '<div class="home-custom">', '<div class="home-news">');

  const heroTitle = htmlToText(matchOne(html, /<div class="inner-content">[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i));
  const heroDescription = htmlToText(matchOne(html, /<div class="inner-content">[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/i));
  const companyParagraphs = extractParagraphsFromBlock(matchOne(companySection, /<div class="company-summary">([\s\S]*?)<\/div>/i));
  const solutionItems = [...solutionSection.matchAll(/<div class="item-col solution-col">[\s\S]*?<img[^>]+src="([^"]+)"[^>]*alt="([^"]+)"[\s\S]*?<h3 class="entry-title">([\s\S]*?)<\/h3>[\s\S]*?<div class="entry-text">([\s\S]*?)<\/div>[\s\S]*?<\/div>\s*<\/div>/gi)].map((match) => ({
    title: htmlToText(match[3] ?? ''),
    description: htmlToText(match[4] ?? ''),
    image: {
      src: normalizeImagePath(match[1] ?? ''),
      alt: decodeHtml(match[2] ?? ''),
    },
  }));
  const customOptions = [...customOptionsSection.matchAll(/<div class="item-col custom-col">[\s\S]*?<img[^>]+src="([^"]+)"[^>]*alt="([^"]+)"[\s\S]*?<h3 class="entry-title">([\s\S]*?)<\/h3>[\s\S]*?<div class="entry-text">([\s\S]*?)<\/div>[\s\S]*?(?:<a|<button)[^>]*class="more"[^>]*>([\s\S]*?)(?:<\/a>|<\/button>)[\s\S]*?<\/div>\s*<\/div>/gi)].map((match) => ({
    title: htmlToText(match[3] ?? ''),
    description: htmlToText(match[4] ?? ''),
    image: {
      src: normalizeImagePath(match[1] ?? ''),
      alt: decodeHtml(match[2] ?? ''),
    },
    buttonLabel: htmlToText(match[5] ?? '') || 'Contact Us',
    buttonHref: '/contact',
  }));

  return {
    hero: {
      title: heroTitle,
      description: heroDescription,
    },
    company: {
      eyebrow: htmlToText(matchOne(companySection, /<p class="company-subtitle">([\s\S]*?)<\/p>/i)) || 'About Us',
      title: htmlToText(matchOne(companySection, /<h2 class="company-title">([\s\S]*?)<\/h2>/i)),
      description: companyParagraphs.join('\n\n'),
      image: extractFirstImage(companySection, 'about'),
      buttonLabel: htmlToText(matchOne(companySection, /<a[^>]+class="more[^"]*"[^>]*>([\s\S]*?)<\/a>/i)) || 'Explore Us',
      buttonHref: '/products',
    },
    solutions: solutionItems,
    customization: {
      title: htmlToText(matchOne(customizationSection, /<h2[^>]*>([\s\S]*?)<\/h2>/i)),
      description: extractParagraphsFromBlock(customizationSection).join('\n\n'),
      image: extractFirstImage(customizationSection, 'custom'),
      buttonLabel: htmlToText(matchOne(customizationSection, /<a[^>]+class="more"[^>]*>([\s\S]*?)<\/a>/i)) || 'View Customized Services',
      buttonHref: '/customization',
    },
    customOptions,
  };
}

const pages = reconstruction.pages;
const homePage = pages.find((page) => page.url === 'https://www.birthdaycakecandle.com/');

if (!homePage) throw new Error('Home page not found in reconstruction index.');

const categoryPages = pages.filter((page) => {
  const segments = getSegments(page.url);
  return segments.length === 1 && !reservedSlugs.has(segments[0]!);
});

const productPages = pages.filter((page) => {
  const segments = getSegments(page.url);
  return segments.length === 2 && segments[0] !== 'news';
});

const newsPages = pages.filter((page) => {
  const segments = getSegments(page.url);
  return segments.length === 2 && segments[0] === 'news';
});

const staticPages = pages.filter((page) => singlePageSlugs.has(getSlugFromUrl(page.url)));

const homeHtml = await readPageHtml(homePage);
const homeNarrative = parseHomeContent(homeHtml);
const homeImages = await getPageImages(homePage);
const newsIndexPage = pages.find((page) => page.url === 'https://www.birthdaycakecandle.com/news');
const productsIndexPage = pages.find((page) => page.url === 'https://www.birthdaycakecandle.com/products');

await writeJson('settings/site.json', {
  siteName: 'Sunwing Technology',
  companyName: 'Qingdao Sunwing Technology Service Co., Ltd.',
  siteUrl: 'https://www.birthdaycakecandle.com',
  logo: {
    src: '/images/source/33373eb67955_logo-2-!p.webp',
    alt: 'Sunwing Technology',
  },
  favicon: '/images/source/fb45513fed76_logo-2.ico',
  email: 'customize@birthdaycakecandle.com',
  phone: '+86 18053291849',
  whatsapp: '+86 18053291849',
  address: 'Pingdu City, Qingdao City, China',
  copyright: `© ${new Date().getFullYear()} Qingdao Sunwing Technology Service Co., Ltd.`,
  defaultSeo: toSeo(trimTitle(homePage.title), homeNarrative.hero.description, homeImages[0]),
});

await writeJson('navigation/main.json', {
  headerLinks: [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about-us' },
    { label: 'Products', href: '/products' },
    { label: 'Customization', href: '/customization' },
    { label: 'News', href: '/news' },
    { label: 'Contact', href: '/contact' },
  ],
  footerLinks: [
    { label: 'About Us', href: '/about-us' },
    { label: 'Products', href: '/products' },
    { label: 'Customization', href: '/customization' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Contact', href: '/contact' },
  ],
});

await writeJson('home/index.json', {
  hero: {
    eyebrow: 'Custom Candle Manufacturer',
    title: homeNarrative.hero.title || trimTitle(homePage.title),
    description: homeNarrative.hero.description,
    background: { src: homeImages[0] ?? '', alt: trimTitle(homePage.title) },
    primaryLabel: 'View Products',
    primaryHref: '/products',
    secondaryLabel: 'Understand our customized services',
    secondaryHref: '/customization',
  },
  intro: {
    title: 'Professional candle production for wholesale, OEM, and private label demand',
    description: 'Sunwing Technology focuses on birthday candles, scented candles, dinner candles, tealight candles, and related custom candle programs for international brands, importers, and wholesalers.',
  },
  company: homeNarrative.company,
  solutions: homeNarrative.solutions,
  customization: homeNarrative.customization,
  customOptions: homeNarrative.customOptions,
  featuredCategorySlugs: categoryPages.slice(0, 6).map((page) => getSegments(page.url)[0]!),
  featuredProductSlugs: productPages.slice(0, 6).map((page) => getSegments(page.url)[1]!),
  featuredNewsSlugs: newsPages.slice(0, 3).map((page) => getSegments(page.url)[1]!),
  inquiry: {
    title: 'Need OEM or wholesale candle support?',
    description: 'Use the contact page to start inquiries, request packaging customization, or align on large-volume product needs.',
    buttonLabel: 'Contact Sales',
    buttonHref: '/contact',
  },
  seo: toSeo(trimTitle(homePage.title), homeNarrative.hero.description, homeImages[0]),
});

if (newsIndexPage) {
  const html = await readPageHtml(newsIndexPage);
  const images = await getPageImages(newsIndexPage);
  const parsed = parseNewsIndexPage(html);

  await writeJson('newsPage/index.json', {
    title: parsed.title,
    heroImage: { src: images[0] ?? '', alt: parsed.title },
    summary: parsed.summary,
    inquiry: parsed.inquiry,
    seo: toSeo(parsed.title, parsed.summary, images[0]),
  });
}

if (productsIndexPage) {
  const html = await readPageHtml(productsIndexPage);
  const images = await getPageImages(productsIndexPage);
  const parsed = parseProductsIndexPage(html);

  await writeJson('productsPage/index.json', {
    title: parsed.title,
    heroImage: { src: images[0] ?? '', alt: parsed.title },
    summary: parsed.summary,
    customOptionsHeading: parsed.customOptionsHeading,
    customOptions: parsed.customOptions,
    inquiry: parsed.inquiry,
    seo: toSeo(parsed.title, parsed.summary, images[0]),
  });
}

for (const page of staticPages) {
  const slug = getSlugFromUrl(page.url);
  const html = await readPageHtml(page);
  const images = await getPageImages(page);
  const parsed =
    slug === 'about-us'
      ? parseAboutPage(html)
      : slug === 'customization'
        ? parseCustomizationPage(html)
        : slug === 'contact'
          ? parseContactPage(html)
        : parseGenericPage(html, trimTitle(page.title));

  await writeJson(`pages/${slug}/index.json`, {
    title: trimTitle(page.title),
    slug,
    summary: parsed.summary,
    heroImage: { src: images[0] ?? parsed.sections[0]?.image?.src ?? '', alt: trimTitle(page.title) },
    heroText: parsed.heroText,
    body: parsed.body,
    sections: parsed.sections,
    highlightsHeading: parsed.highlightsHeading,
    highlights: parsed.highlights,
    factsHeading: parsed.factsHeading,
    facts: parsed.facts,
    gallerySection: parsed.gallerySection,
    gallery: parsed.gallery,
    linkedCategorySlugs: parsed.linkedCategorySlugs,
    faqHeading: parsed.faqHeading,
    faq: parsed.faq,
    cta: parsed.cta,
    inquiry: parsed.inquiry,
    seo: toSeo(trimTitle(page.title), parsed.summary, images[0] ?? parsed.sections[0]?.image?.src),
  });
}

for (const [index, page] of categoryPages.entries()) {
  const slug = getSegments(page.url)[0]!;
  const html = await readPageHtml(page);
  const images = await getPageImages(page);
  const parsed = parseCategoryPage(html);

  await writeJson(`productCategories/${slug}.json`, {
    title: trimTitle(page.title),
    slug,
    summary: parsed.summary,
    heroImage: { src: images[0] ?? '', alt: trimTitle(page.title) },
    coverImage: { src: images[1] ?? images[0] ?? '', alt: trimTitle(page.title) },
    introTitle: parsed.introTitle,
    introBody: parsed.introBody,
    primaryCta: parsed.primaryCta,
    secondaryCta: parsed.secondaryCta,
    sortOrder: index + 1,
    seo: toSeo(trimTitle(page.title), parsed.summary, images[0]),
  });
}

for (const page of productPages) {
  const [category, slug] = getSegments(page.url);
  const images = await getPageImages(page);
  const html = await readPageHtml(page);
  const specs = parseProductSpecs(html);
  const body = parseProductBody(html);
  const summary = firstParagraph(body) || page.description || '';

  await writeJson(`products/${slug}/index.json`, {
    title: trimTitle(page.title),
    slug,
    category,
    summary,
    coverImage: { src: images[0] ?? '', alt: page.title },
    gallery: images.slice(0, 6).map((src) => ({ src, alt: page.title })),
    specs,
    body,
    highlights: buildHighlights(body || summary || specs.map((item) => `${item.label}: ${item.value}`).join('. ')),
    seo: toSeo(trimTitle(page.title), summary, images[0]),
  });
}

for (const page of newsPages) {
  const slug = getSegments(page.url)[1]!;
  const images = await getPageImages(page);
  const html = await readPageHtml(page);
  const metadata = await readJson<{ captured_at?: string }>(page.files.metadata);
  const parsed = parseNewsPage(html, slug);

  await writeJson(`news/${slug}/index.json`, {
    title: trimTitle(page.title),
    slug,
    publishedAt: metadata.captured_at?.slice(0, 10) ?? '',
    summary: parsed.summary,
    coverImage: { src: images[0] ?? '', alt: trimTitle(page.title) },
    body: parsed.body,
    relatedNewsSlugs: parsed.relatedNewsSlugs,
    inquiry: parsed.inquiry,
    seo: toSeo(trimTitle(page.title), parsed.summary, images[0]),
  });
}

console.log(`Imported content: ${staticPages.length} pages, ${categoryPages.length} categories, ${productPages.length} products, ${newsPages.length} news entries.`);
