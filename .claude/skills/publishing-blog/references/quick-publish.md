# 快速发布

快速发布是默认模式，适合用户已经写完文章、只想尽快推送上线的场景。

## 1. 使用条件

使用快速发布：

- 用户说“发布博客 / 发出去 / push / 更新博客”
- 用户没有要求本地预览、构建检查或全流程验证
- 当前改动主要是文章内容或小型文档更新

不要使用快速发布：

- 改动包含构建配置、依赖、workflow、Astro 组件或站点路径
- 用户明确说“全流程 / 稳妥 / 先检查 / 跑 build”
- 上一次发布失败且根因未确认

## 2. 发布前轻量检查

执行：

```sh
git status --short
```

检查：

- 当前变更都是用户想发布的内容
- 文章 `draft` 不是 `true`
- 没有 `.env`、token、账号密钥等敏感文件
- 没有明显无关的大量构建产物

阻断条件：发现敏感文件、无关改动或用户没确认的文件时，先停下询问。

## 3. 执行发布

默认命令：

```sh
pnpm publish-blog "Publish blog updates"
```

指定 commit message：

```sh
pnpm publish-blog "Publish my post"
```

脚本默认执行快速发布：

- 展示当前 Git 变更并等待确认
- `git add -A`
- `git commit -m "<message>"`
- `git push origin main`

快速发布不运行：

- `pnpm check`
- `pnpm build`
- 本地预览

这是有意设计：快速发布依赖 CI 在远端兜底，适合文章类小改动。

## 4. 发布后说明

推送成功后告诉用户：

- GitHub Actions 会自动部署 GitHub Pages
- GitHub Actions 会自动部署 Cloudflare Pages
- 线上可稍等 1-3 分钟刷新

如果没有验证线上访问，必须写：

```text
未验证线上访问。
```

## 5. 失败处理

如果脚本失败：

- 读取错误输出
- 判断失败发生在分支检查、提交、push 还是远端拒绝
- 不要机械重跑
- 需要构建证据时切换到全流程发布
