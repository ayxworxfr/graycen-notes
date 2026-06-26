# 全流程发布

全流程发布适合需要本地确认、构建验证或排查失败的场景。

## 1. 使用条件

使用全流程发布：

- 用户明确说“全流程 / 稳妥 / 完整检查 / 先预览 / 跑 build”
- 改动包含配置、组件、依赖、workflow、路径或搜索逻辑
- 快速发布失败，需要本地复现
- 用户要求确认发布前没有问题

## 2. 本地预览

启动开发服务器：

```sh
pnpm dev
```

检查路径：

- 首页
- 新文章页
- 归档页
- 搜索入口

如果无法打开浏览器或用户不要求 UI 检查，明确写：

```text
未验证浏览器预览：<原因>
```

## 3. 自动检查

运行：

```sh
pnpm check
pnpm build
```

检查构建输出包含：

```text
dist/pagefind/pagefind.js
```

阻断条件：

- `pnpm check` 失败
- `pnpm build` 失败
- Pagefind 产物缺失

任一命中时先修根因，不允许继续发布。

## 4. 执行发布

全流程发布命令：

```sh
pnpm publish-blog --full "Publish blog updates"
```

脚本会执行：

- 展示当前 Git 变更并等待确认
- `pnpm check`
- `pnpm build`
- `git add -A`
- `git commit -m "<message>"`
- `git push origin main`

## 5. 线上验证

推送成功后检查：

- GitHub Pages: `https://ayxworxfr.github.io/graycen-notes/`
- Cloudflare Pages: `https://graycen-notes.pages.dev/`

如果无法访问外网或用户没要求等待部署完成，明确写：

```text
未验证线上访问：<原因>
```

## 6. 输出要求

全流程发布完成后输出：

- 本地预览是否做了
- `pnpm check` 结果
- `pnpm build` 结果
- push 是否成功
- 线上访问是否验证
