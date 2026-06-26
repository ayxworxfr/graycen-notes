---
name: publishing-blog
description: Publishes Graycen Notes blog updates in quick or full mode, and can turn pasted blog drafts into post files before publishing. Use when the user says "发布博客" / "发文章" / "快速发布" / "全流程发布" / "部署博客" / "publish blog" / "把文章发出去" / "更新博客".
---

# Publishing Blog

## Core Principle

默认走快速发布：确认文章和 Git 变更后直接 commit + push，让 CI 自动部署。只有用户要求“全流程 / 稳妥 / 检查 / 预览 / build”，或改动触及构建配置、组件、workflow、路径时，才升级到全流程发布。

## 适用范围

使用本 skill：

- 用户要发布 Graycen Notes 的文章或站点更新
- 用户要新建文章并推送上线
- 用户直接贴一篇博客内容，要求创建文章并发布
- 用户问博客发布、部署、Pages 同步或 Pagefind 搜索发布流程
- 用户要求排查 GitHub Pages / Cloudflare Pages 部署后的资源路径问题

不要使用本 skill：

- 只写文章正文、不准备发布
- 只审查代码 diff
- 需要创建或修改其他项目的发布流程
- 需要处理 Cloudflare API Token、GitHub Secrets 等敏感配置

## 模式判定

| 用户信号 | 模式 | 读取 |
|---|---|---|
| 贴出博客正文 / 草稿 / Markdown，并要求发出去 | 接收文章 + 发布 | [intake-post.md](references/intake-post.md)，再按发布模式继续 |
| “发布博客 / 发出去 / push / 更新博客” | 快速发布（默认） | [quick-publish.md](references/quick-publish.md) |
| “全流程 / 稳妥 / 检查 / 预览 / build / 确认没问题” | 全流程发布 | [full-publish.md](references/full-publish.md) |
| 部署失败 / 404 / 搜索不可用 / CI 失败 | 故障排查 | [troubleshooting.md](references/troubleshooting.md) |

如果用户没有指定模式，选择快速发布。

## 强制流程

### 1. 确认仓库

检查当前目录必须是 Graycen Notes 仓库：

```sh
git rev-parse --show-toplevel
```

阻断条件：仓库根目录不是 `graycen-notes` 时，先切到正确项目，不要执行发布命令。

### 2. 处理文章输入

如果用户直接贴文章内容，先读取 [intake-post.md](references/intake-post.md)，创建或更新 `src/content/posts/<slug>.md`。

如果缺少标题、slug、摘要、标签、分类等发布信息，一次性询问用户补齐，不要自行编造。

阻断条件：目标文件已存在但用户没有确认覆盖或编辑时，不允许写入。

### 3. 选择发布模式

根据“模式判定”选择一个路径：

- 快速发布：读取 [quick-publish.md](references/quick-publish.md)，运行 `pnpm publish-blog "<message>"`
- 全流程发布：读取 [full-publish.md](references/full-publish.md)，运行 `pnpm publish-blog --full "<message>"`

阻断条件：改动包含 `astro.config.mjs`、`.github/workflows/`、`package.json`、组件代码或部署路径时，必须升级到全流程发布。

### 4. 执行发布

快速发布命令：

```sh
pnpm publish-blog "Publish blog updates"
```

全流程发布命令：

```sh
pnpm publish-blog --full "Publish blog updates"
```

发布脚本位于：

```text
.claude/skills/publishing-blog/scripts/publish-blog.js
```

### 5. 中段自检

进入发布前确认：

- [ ] 当前仓库是 Graycen Notes
- [ ] 如果用户贴了文章，已创建或更新目标文章文件
- [ ] 缺失发布信息已一次性询问并补齐
- [ ] 已根据用户信号选择快速发布或全流程发布
- [ ] 快速发布没有触碰构建配置、组件、workflow、依赖或部署路径
- [ ] 全流程发布已安排 `pnpm check` 和 `pnpm build`

任一未通过，回到对应步骤补齐。

## 质量门

### 阻断条件

以下任一命中，必须停止发布：

- 当前分支不是 `main`
- `git status --short` 展示了用户不想发布的无关变更
- 全流程发布中 `pnpm check` 失败
- 全流程发布中 `pnpm build` 失败
- 文章仍是 `draft: true`
- 用户贴文缺少必要 frontmatter 信息且尚未补齐

### Final Gate

声称发布完成前必须确认：

- [ ] 具体发布命令已执行成功
- [ ] push 到 `main` 已成功
- [ ] GitHub Actions 会部署 GitHub Pages 和 Cloudflare Pages
- [ ] 发布模式已说明：快速发布或全流程发布
- [ ] 未验证线上状态时明确写出“未验证线上访问”

## 禁止输出模式

| 禁止输出 | 替代动作 |
|---|---|
| “默认先完整检查” | 默认快速发布；只有命中条件才升级全流程 |
| “直接把正文发出去” | 先创建文章文件并补齐 frontmatter |
| “应该会自动部署” | 说明触发条件是 push 到 `main`，并检查对应 workflow |
| “搜索坏了可能是缓存” | 检查 Pagefind 构建产物和资源路径 |
| “GitHub Pages 404 是环境问题” | 对照 `ASTRO_BASE: /graycen-notes` |
| “Cloudflare 和 GitHub 配一样” | 区分 Cloudflare 根路径 `/` 与 GitHub 子路径 `/graycen-notes` |
| “发布完了” | 给出 push 成功或未验证原因 |

## 输出骨架

```markdown
## 发布结果

- 模式：
- 文章文件：
- 命令：
- 结果：
- 部署目标：

## 验证

- 快速发布：
- 全流程检查：
- 线上访问：

## 残留

- <没有写“无”；未验证线上访问必须写明>
```
