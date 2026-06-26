# Graycen Notes

Graycen 的个人博客，用来记录技术实践、产品想法和日常思考。

这个项目基于 [Astro](https://astro.build) 和 Fuwari 主题改造，内容以 Markdown / MDX 为主，构建产物是静态站点。站点支持文章归档、搜索、目录、RSS、数学公式、代码高亮、GitHub 风格提示块和深浅色主题。

## 技术栈

- Astro 5
- Svelte 5
- Tailwind CSS
- TypeScript
- Biome
- Pagefind
- Expressive Code

## 项目结构

```text
.
├── src/
│   ├── config.ts          # 站点、导航、个人资料和许可证配置
│   ├── content/
│   │   ├── posts/         # 博客文章
│   │   ├── spec/          # 独立页面内容，例如关于页
│   │   └── config.ts      # 内容集合定义
│   ├── pages/             # Astro 页面入口
│   ├── components/        # 页面组件
│   └── plugins/           # Markdown / rehype / Expressive Code 插件
├── public/                # 静态资源
├── scripts/
│   └── new-post.js        # 新文章脚本
├── .claude/
│   └── skills/
│       └── publishing-blog/
│           └── scripts/
│               └── publish-blog.js # 发布博客脚本
├── astro.config.mjs       # Astro 构建配置
└── package.json
```

## 本地开发

项目使用 pnpm。首次启动前先安装依赖：

```sh
pnpm install
```

启动开发服务器：

```sh
pnpm dev
```

默认本地地址是 `http://localhost:4321`。

## 写文章

新建文章：

```sh
pnpm new-post <filename>
```

文章会放在 `src/content/posts/` 下。常用 frontmatter：

```yaml
---
title: 文章标题
published: 2026-01-01
description: 文章摘要
image: ./cover.jpg
tags: [Astro, Notes]
category: 技术
draft: false
---
```

字段说明：

- `title`：文章标题
- `published`：发布时间
- `description`：文章摘要，用于列表和 SEO
- `image`：封面图，可选
- `tags`：标签
- `category`：分类
- `draft`：是否为草稿，`true` 时不作为正式文章发布

发布文章：

```sh
pnpm publish-blog "Publish blog updates"
```

默认是快速发布，只提交并推送到 `main`。需要本地检查和构建时使用全流程发布：

```sh
pnpm publish-blog --full "Publish blog updates"
```

完整发布流程见项目 skill：`.claude/skills/publishing-blog/SKILL.md`。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm build` | 构建静态站点，并生成 Pagefind 搜索索引 |
| `pnpm preview` | 本地预览构建结果 |
| `pnpm check` | 运行 Astro 检查 |
| `pnpm type-check` | 运行 TypeScript 类型检查 |
| `pnpm format` | 使用 Biome 格式化 `src` |
| `pnpm lint` | 使用 Biome 检查并修复 `src` |
| `pnpm new-post <filename>` | 创建新文章 |
| `pnpm publish-blog "<message>"` | 快速提交并推送博客更新 |
| `pnpm publish-blog --full "<message>"` | 检查、构建、提交并推送博客更新 |

## 内容能力

- Markdown 文章与独立页面
- 自动阅读时间和摘要
- 右侧文章目录
- RSS 与 sitemap
- Pagefind 站内搜索
- KaTeX 数学公式
- Expressive Code 代码块增强
- GitHub admonitions 提示块
- GitHub 仓库卡片组件

## 部署

当前 CI 配置在 `.github/workflows/`：

- `biome.yml`：在 `main` 分支 push / PR 时运行 Biome、Astro 检查和构建；push 时部署 GitHub Pages。
- `cloudflare-pages.yml`：在 `main` 分支 push 或手动触发时构建并部署 Cloudflare Pages。

构建输出目录是 `dist/`。

## 许可证

站点内容默认使用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。

主题基础来自 [Fuwari](https://github.com/saicaca/fuwari)，原项目使用 MIT License。
