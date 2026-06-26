# 发布故障排查

发布或部署失败时，先定位失败阶段，再修根因。

## 1. 判断失败阶段

按顺序分类：

- 本地脚本失败：`pnpm publish-blog` 报错
- Git 提交失败：commit hook、身份、无 staged changes
- Push 失败：权限、远端拒绝、分支保护
- GitHub Actions 失败：workflow check/build/deploy 报错
- 线上访问失败：资源 404、页面空白、搜索不可用

阻断条件：没确认失败阶段时，不要直接改配置。

## 2. GitHub Pages 路径问题

如果 GitHub Pages 资源 404，检查 `.github/workflows/biome.yml`：

```yaml
ASTRO_BASE: /graycen-notes
```

正确资源路径应包含：

```text
/graycen-notes/
```

例如：

```text
https://ayxworxfr.github.io/graycen-notes/pagefind/pagefind.js
```

旧路径继续 404 是正常的：

```text
https://ayxworxfr.github.io/pagefind/pagefind.js
```

## 3. Cloudflare Pages 路径问题

如果 Cloudflare Pages 资源 404，检查 `.github/workflows/cloudflare-pages.yml`：

```yaml
ASTRO_BASE: /
```

Cloudflare 站点挂在根路径，不要使用 `/graycen-notes`。

## 4. Pagefind 搜索问题

检查构建日志是否出现：

```text
Running Pagefind
```

检查本地产物：

```text
dist/pagefind/pagefind.js
```

如果文件缺失，先运行全流程发布里的 `pnpm build`，不要只改前端搜索代码。

## 5. CI 与本地差异

检查 workflow 使用：

- Node.js 22
- pnpm
- `pnpm install --frozen-lockfile`
- `pnpm check`
- `pnpm build`

如果本地通过但 CI 失败，优先比较 Node/pnpm 版本、环境变量和构建 base。

## 6. 输出要求

排查结果必须写：

- 失败阶段
- 根因证据
- 修改了什么
- 验证命令
- 仍未验证的部分
