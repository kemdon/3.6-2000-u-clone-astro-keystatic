# Keystatic GitHub Mode Setup

当前项目已改为使用 GitHub storage：

- 仓库：`kemdon/3.6-2000-u-clone-astro-keystatic`
- 分支：`main`
- 前台域名：`https://ugo.zhidaola.top`
- 后台地址：`https://ugo.zhidaola.top/keystatic`

要让线上后台真正具备“保存后提交到 GitHub”的能力，还需要完成 GitHub App 初始化，并把生成的环境变量写入 Vercel。

## 必要环境变量

Vercel 项目里至少需要这 4 个变量：

- `KEYSTATIC_GITHUB_CLIENT_ID`
- `KEYSTATIC_GITHUB_CLIENT_SECRET`
- `KEYSTATIC_SECRET`
- `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`

## 初始化顺序

1. 在本地启动项目并打开 `/keystatic`
2. 按 Keystatic 的 GitHub mode 引导创建或连接 GitHub App
3. 记录生成的 4 个环境变量
4. 将这 4 个变量写入 Vercel 项目的 Production / Preview / Development 环境
5. 重新部署 Vercel
6. 再访问 `https://ugo.zhidaola.top/keystatic` 验证保存是否会提交到 GitHub

## Vercel CLI 示例

```powershell
vercel env add KEYSTATIC_GITHUB_CLIENT_ID production
vercel env add KEYSTATIC_GITHUB_CLIENT_SECRET production
vercel env add KEYSTATIC_SECRET production
vercel env add PUBLIC_KEYSTATIC_GITHUB_APP_SLUG production
```

如果还需要 Preview / Development，也分别添加：

```powershell
vercel env add KEYSTATIC_GITHUB_CLIENT_ID preview
vercel env add KEYSTATIC_GITHUB_CLIENT_SECRET preview
vercel env add KEYSTATIC_SECRET preview
vercel env add PUBLIC_KEYSTATIC_GITHUB_APP_SLUG preview

vercel env add KEYSTATIC_GITHUB_CLIENT_ID development
vercel env add KEYSTATIC_GITHUB_CLIENT_SECRET development
vercel env add KEYSTATIC_SECRET development
vercel env add PUBLIC_KEYSTATIC_GITHUB_APP_SLUG development
```

## 当前已确认的现状

- Vercel 项目：`3.6-2000-u-clone-astro-keystatic`
- 自定义域名已绑定到该项目：`ugo.zhidaola.top`
- 当前 Vercel 项目还没有任何 `KEYSTATIC_*` 环境变量
- 如果不补这些变量，切到 GitHub mode 后，线上后台无法完成 GitHub 持久化发布
