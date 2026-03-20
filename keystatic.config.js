import { config, fields, collection, singleton } from '@keystatic/core';

const imageField = (label, description) =>
  fields.object(
    {
      media: fields.relationship({
        label: `${label} 媒体库引用`,
        collection: 'mediaLibrary',
        description: '优先从媒体库选择，便于统一替换和维护',
      }),
      src: fields.text({ label: `${label} 备用路径`, description: description || '未关联媒体库时作为备用路径使用', defaultValue: '' }),
      alt: fields.text({ label: `${label} Alt`, defaultValue: '' }),
    },
    { label }
  );

const uploadedImageField = (label, directory = 'public/uploads/images', publicPath = '/uploads/images/') =>
  fields.image({
    label,
    directory,
    publicPath,
  });

const uploadedFileField = (label, directory = 'public/uploads/files', publicPath = '/uploads/files/') =>
  fields.file({
    label,
    directory,
    publicPath,
  });

const seoFields = {
  title: fields.text({ label: 'SEO 标题', defaultValue: '' }),
  description: fields.text({ label: 'SEO 描述', defaultValue: '', multiline: true }),
  image: imageField('SEO 图片'),
};

const linkFields = {
  label: fields.text({ label: '文案', defaultValue: '' }),
  href: fields.text({ label: '链接', defaultValue: '' }),
};

export default config({
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'Sunwing Astro CMS' },
    navigation: {
      内容: ['home', 'pages', 'productCategories', 'products', 'news', 'mediaLibrary'],
      全局: ['site', 'navigation'],
    },
  },
  singletons: {
    site: singleton({
      label: '站点设置',
      path: 'content/settings/site',
      format: 'json',
      schema: {
        siteName: fields.text({ label: '站点名称', validation: { isRequired: true } }),
        companyName: fields.text({ label: '公司名称', validation: { isRequired: true } }),
        siteUrl: fields.text({ label: '站点 URL', validation: { isRequired: true } }),
        logo: imageField('Logo'),
        favicon: fields.text({ label: 'Favicon 路径', defaultValue: '' }),
        email: fields.text({ label: '邮箱', defaultValue: '' }),
        phone: fields.text({ label: '电话', defaultValue: '' }),
        whatsapp: fields.text({ label: 'WhatsApp', defaultValue: '' }),
        facebook: fields.text({ label: 'Facebook', defaultValue: '' }),
        address: fields.text({ label: '地址', defaultValue: '', multiline: true }),
        downloadLabel: fields.text({ label: '下载按钮文案', defaultValue: 'Download' }),
        downloadFile: uploadedFileField('下载文件'),
        floatingContact: fields.object(
          {
            enabled: fields.checkbox({ label: '启用悬浮联系组件', defaultValue: true }),
            title: fields.text({ label: '标题', defaultValue: 'Contact Us' }),
            email: fields.text({ label: '邮箱', defaultValue: '' }),
            whatsapp: fields.text({ label: 'WhatsApp', defaultValue: '' }),
            facebook: fields.text({ label: 'Facebook', defaultValue: '' }),
          },
          { label: '悬浮联系组件' }
        ),
        copyright: fields.text({ label: '版权文案', defaultValue: '' }),
        defaultSeo: fields.object(seoFields, { label: '默认 SEO' }),
      },
    }),
    navigation: singleton({
      label: '导航',
      path: 'content/navigation/main',
      format: 'json',
      schema: {
        headerLinks: fields.array(
          fields.object({
            label: fields.text({ label: '名称', validation: { isRequired: true } }),
            href: fields.text({ label: '链接', validation: { isRequired: true } }),
          }),
          { label: '头部导航' }
        ),
        footerLinks: fields.array(
          fields.object({
            label: fields.text({ label: '名称', validation: { isRequired: true } }),
            href: fields.text({ label: '链接', validation: { isRequired: true } }),
          }),
          { label: '页脚导航' }
        ),
      },
    }),
    home: singleton({
      label: '首页',
      path: 'content/home/index',
      format: 'json',
      schema: {
        hero: fields.object(
          {
            eyebrow: fields.text({ label: '眉题', defaultValue: '' }),
            title: fields.text({ label: '标题', validation: { isRequired: true } }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
            background: imageField('背景图'),
            primaryLabel: fields.text({ label: '主按钮文案', defaultValue: 'View Products' }),
            primaryHref: fields.text({ label: '主按钮链接', defaultValue: '/products' }),
            secondaryLabel: fields.text({ label: '次按钮文案', defaultValue: 'Contact Us' }),
            secondaryHref: fields.text({ label: '次按钮链接', defaultValue: '/contact' }),
          },
          { label: 'Hero' }
        ),
        intro: fields.object(
          {
            title: fields.text({ label: '简介标题', defaultValue: '' }),
            description: fields.text({ label: '简介描述', defaultValue: '', multiline: true }),
          },
          { label: '简介' }
        ),
        company: fields.object(
          {
            eyebrow: fields.text({ label: '眉题', defaultValue: 'About Us' }),
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
            image: imageField('配图'),
            buttonLabel: fields.text({ label: '按钮文案', defaultValue: 'Explore Us' }),
            buttonHref: fields.text({ label: '按钮链接', defaultValue: '/products' }),
          },
          { label: '公司介绍' }
        ),
        solutions: fields.array(
          fields.object({
            title: fields.text({ label: '标题', validation: { isRequired: true } }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
            image: imageField('图标'),
          }),
          { label: '解决方案卡片' }
        ),
        customization: fields.object(
          {
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
            image: imageField('配图'),
            buttonLabel: fields.text({ label: '按钮文案', defaultValue: 'View Customized Services' }),
            buttonHref: fields.text({ label: '按钮链接', defaultValue: '/customization' }),
          },
          { label: '定制服务' }
        ),
        customOptions: fields.array(
          fields.object({
            title: fields.text({ label: '标题', validation: { isRequired: true } }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
            image: imageField('配图'),
            buttonLabel: fields.text({ label: '按钮文案', defaultValue: 'Contact Us' }),
            buttonHref: fields.text({ label: '按钮链接', defaultValue: '/contact' }),
          }),
          { label: '定制选项' }
        ),
        featuredCategorySlugs: fields.array(fields.relationship({ label: '分类', collection: 'productCategories' }), { label: '首页分类' }),
        featuredProductSlugs: fields.array(fields.relationship({ label: '产品', collection: 'products' }), { label: '首页产品' }),
        featuredNewsSlugs: fields.array(fields.relationship({ label: '新闻', collection: 'news' }), { label: '首页新闻' }),
        inquiry: fields.object(
          {
            title: fields.text({ label: '询盘标题', defaultValue: '' }),
            description: fields.text({ label: '询盘描述', defaultValue: '', multiline: true }),
            buttonLabel: fields.text({ label: '按钮文案', defaultValue: 'Get A Quote' }),
            buttonHref: fields.text({ label: '按钮链接', defaultValue: '/contact' }),
          },
          { label: '询盘区' }
        ),
        seo: fields.object(seoFields, { label: 'SEO' }),
      },
    }),
    newsPage: singleton({
      label: '新闻聚合页',
      path: 'content/newsPage/index',
      format: 'json',
      schema: {
        title: fields.text({ label: '标题', validation: { isRequired: true } }),
        heroImage: imageField('头图'),
        summary: fields.text({ label: '摘要', defaultValue: '', multiline: true }),
        inquiry: fields.object(
          {
            title: fields.text({ label: '询盘标题', defaultValue: '' }),
            description: fields.text({ label: '询盘描述', defaultValue: '', multiline: true }),
            buttonLabel: fields.text({ label: '按钮文案', defaultValue: 'Contact Us' }),
            buttonHref: fields.text({ label: '按钮链接', defaultValue: '/contact' }),
          },
          { label: '询盘区' }
        ),
        seo: fields.object(seoFields, { label: 'SEO' }),
      },
    }),
    productsPage: singleton({
      label: '产品聚合页',
      path: 'content/productsPage/index',
      format: 'json',
      schema: {
        title: fields.text({ label: '标题', validation: { isRequired: true } }),
        heroImage: imageField('头图'),
        summary: fields.text({ label: '摘要', defaultValue: '', multiline: true }),
        customOptionsHeading: fields.object(
          {
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
          },
          { label: '扩展选项标题' }
        ),
        customOptions: fields.array(
          fields.object({
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
            image: imageField('配图'),
            buttonLabel: fields.text({ label: '按钮文案', defaultValue: 'Contact Us' }),
            buttonHref: fields.text({ label: '按钮链接', defaultValue: '/contact' }),
          }),
          { label: '扩展选项' }
        ),
        inquiry: fields.object(
          {
            title: fields.text({ label: '询盘标题', defaultValue: '' }),
            description: fields.text({ label: '询盘描述', defaultValue: '', multiline: true }),
            buttonLabel: fields.text({ label: '按钮文案', defaultValue: 'Contact Us' }),
            buttonHref: fields.text({ label: '按钮链接', defaultValue: '/contact' }),
          },
          { label: '询盘区' }
        ),
        seo: fields.object(seoFields, { label: 'SEO' }),
      },
    }),
  },
  collections: {
    pages: collection({
      label: '单页',
      path: 'content/pages/*/index',
      slugField: 'slug',
      format: 'json',
      columns: ['title', 'slug'],
      schema: {
        title: fields.text({ label: '标题', validation: { isRequired: true } }),
        slug: fields.slug({ name: { label: 'Slug' } }),
        summary: fields.text({ label: '摘要', defaultValue: '', multiline: true }),
        heroImage: imageField('头图'),
        heroText: fields.text({ label: '头图区说明', defaultValue: '', multiline: true }),
        body: fields.text({ label: '正文', defaultValue: '', multiline: true }),
        sections: fields.array(
          fields.object({
            eyebrow: fields.text({ label: '眉题', defaultValue: '' }),
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
            image: imageField('配图'),
            button: fields.object(linkFields, { label: '按钮' }),
          }),
          { label: '内容区块' }
        ),
        highlightsHeading: fields.object(
          {
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
          },
          { label: '亮点区标题' }
        ),
        highlights: fields.array(
          fields.object({
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
            image: imageField('配图'),
          }),
          { label: '亮点卡片' }
        ),
        factsHeading: fields.object(
          {
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
          },
          { label: '事实区标题' }
        ),
        facts: fields.array(
          fields.object({
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
          }),
          { label: '事实卡片' }
        ),
        gallerySection: fields.object(
          {
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
          },
          { label: '图库标题' }
        ),
        gallery: fields.array(imageField('图片'), { label: '图库' }),
        linkedCategorySlugs: fields.array(fields.relationship({ label: '分类', collection: 'productCategories' }), { label: '关联分类' }),
        faqHeading: fields.object(
          {
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
            image: imageField('配图'),
          },
          { label: 'FAQ 标题区' }
        ),
        faq: fields.array(
          fields.object({
            question: fields.text({ label: '问题', defaultValue: '' }),
            answer: fields.text({ label: '答案', defaultValue: '', multiline: true }),
          }),
          { label: 'FAQ' }
        ),
        cta: fields.object(
          {
            eyebrow: fields.text({ label: '眉题', defaultValue: '' }),
            title: fields.text({ label: '标题', defaultValue: '' }),
            description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
            image: imageField('配图'),
            button: fields.object(linkFields, { label: '按钮' }),
          },
          { label: 'CTA 区' }
        ),
        inquiry: fields.object(
          {
            title: fields.text({ label: '询盘标题', defaultValue: '' }),
            description: fields.text({ label: '询盘描述', defaultValue: '', multiline: true }),
          },
          { label: '询盘区' }
        ),
        seo: fields.object(seoFields, { label: 'SEO' }),
      },
    }),
    productCategories: collection({
      label: '产品分类',
      path: 'content/productCategories/*',
      slugField: 'slug',
      format: 'json',
      columns: ['title', 'slug'],
      schema: {
        title: fields.text({ label: '名称', validation: { isRequired: true } }),
        slug: fields.slug({ name: { label: 'Slug' } }),
        summary: fields.text({ label: '摘要', defaultValue: '', multiline: true }),
        heroImage: imageField('头图'),
        coverImage: imageField('封面图'),
        introTitle: fields.text({ label: '介绍标题', defaultValue: '' }),
        introBody: fields.text({ label: '介绍正文', defaultValue: '', multiline: true }),
        primaryCta: fields.object(linkFields, { label: '主按钮' }),
        secondaryCta: fields.object(linkFields, { label: '次按钮' }),
        sortOrder: fields.integer({ label: '排序', defaultValue: 0 }),
        seo: fields.object(seoFields, { label: 'SEO' }),
      },
    }),
    products: collection({
      label: '产品',
      path: 'content/products/*/index',
      slugField: 'slug',
      format: 'json',
      columns: ['title', 'slug', 'category'],
      schema: {
        title: fields.text({ label: '标题', validation: { isRequired: true } }),
        slug: fields.slug({ name: { label: 'Slug' } }),
        category: fields.relationship({ label: '所属分类', collection: 'productCategories', validation: { isRequired: true } }),
        summary: fields.text({ label: '摘要', defaultValue: '', multiline: true }),
        coverImage: imageField('封面图'),
        gallery: fields.array(imageField('图片'), { label: '图集' }),
        specs: fields.array(
          fields.object({
            label: fields.text({ label: '参数名', validation: { isRequired: true } }),
            value: fields.text({ label: '参数值', validation: { isRequired: true } }),
          }),
          { label: '规格参数' }
        ),
        body: fields.text({ label: '正文', defaultValue: '', multiline: true }),
        highlights: fields.array(fields.text({ label: '卖点', defaultValue: '' }), { label: '卖点列表' }),
        seo: fields.object(seoFields, { label: 'SEO' }),
      },
    }),
    news: collection({
      label: '新闻',
      path: 'content/news/*/index',
      slugField: 'slug',
      format: 'json',
      columns: ['title', 'slug', 'publishedAt'],
      schema: {
        title: fields.text({ label: '标题', validation: { isRequired: true } }),
        slug: fields.slug({ name: { label: 'Slug' } }),
        publishedAt: fields.text({ label: '发布时间', defaultValue: '' }),
        summary: fields.text({ label: '摘要', defaultValue: '', multiline: true }),
        coverImage: imageField('封面图'),
        body: fields.text({ label: '正文', defaultValue: '', multiline: true }),
        contentBlocks: fields.array(
          fields.object({
            type: fields.select({
              label: '内容类型',
              defaultValue: 'paragraph',
              options: [
                { label: '段落', value: 'paragraph' },
                { label: '图片', value: 'image' },
              ],
            }),
            text: fields.text({ label: '段落内容', defaultValue: '', multiline: true }),
            media: fields.relationship({
              label: '媒体库图片',
              collection: 'mediaLibrary',
              description: '优先从媒体库选择，便于统一替换和维护',
            }),
            image: uploadedImageField('图片', 'public/uploads/images/news', '/uploads/images/news/'),
            imageAlt: fields.text({ label: '图片 Alt', defaultValue: '' }),
            caption: fields.text({ label: '图片说明', defaultValue: '', multiline: true }),
          }),
          { label: '正文内容块' }
        ),
        relatedNewsSlugs: fields.array(fields.relationship({ label: '关联新闻', collection: 'news' }), { label: '关联新闻' }),
        inquiry: fields.object(
          {
            title: fields.text({ label: '询盘标题', defaultValue: '' }),
            description: fields.text({ label: '询盘描述', defaultValue: '', multiline: true }),
            buttonLabel: fields.text({ label: '按钮文案', defaultValue: 'Contact Us' }),
            buttonHref: fields.text({ label: '按钮链接', defaultValue: '/contact' }),
          },
          { label: '询盘区' }
        ),
        seo: fields.object(seoFields, { label: 'SEO' }),
      },
    }),
    mediaLibrary: collection({
      label: '媒体库',
      path: 'content/mediaLibrary/*',
      slugField: 'slug',
      format: 'json',
      columns: ['title', 'assetType'],
      previewUrl: '/media-preview/{slug}',
      schema: {
        title: fields.text({ label: '名称', validation: { isRequired: true } }),
        slug: fields.slug({ name: { label: 'Slug' } }),
        assetType: fields.select({
          label: '文件类型',
          defaultValue: 'file',
          options: [
            { label: '文件', value: 'file' },
            { label: '图片', value: 'image' },
          ],
        }),
        image: uploadedImageField('图片资源', 'public/uploads/images/library', '/uploads/images/library/'),
        file: uploadedFileField('文件资源', 'public/uploads/files/library', '/uploads/files/library/'),
        previewImage: uploadedImageField('封面图', 'public/uploads/images/library', '/uploads/images/library/'),
        alt: fields.text({ label: '默认 Alt', defaultValue: '' }),
        description: fields.text({ label: '描述', defaultValue: '', multiline: true }),
      },
    }),
  },
});
