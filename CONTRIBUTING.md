# 代码贡献指南

感谢你愿意为 Graycen Notes 做贡献。这个项目是基于 Astro 和 Fuwari 改造的个人博客，核心目标是保持内容发布稳定、站点结构清晰、代码改动可审查。

## 贡献范围

欢迎提交这些类型的改动：

- 修复文章、页面、样式或构建问题
- 改进博客功能，例如导航、友链、工具页、搜索和 RSS
- 优化现有组件的可维护性和可访问性
- 补充文档、发布流程和开发说明

不建议在同一个 PR 中混合多类改动。文章更新、功能开发、样式调整、发布流程修改必须拆开提交。

## 开发准备

项目使用 `pnpm`：

```sh
pnpm install
pnpm dev
```

常用检查命令：

```sh
pnpm check
pnpm exec biome check ./src
pnpm build
```

提交前至少运行 `pnpm check` 和 `pnpm build`。如果改动涉及 `src/` 下代码，还必须运行 `pnpm exec biome check ./src`。

## 项目约定

### 复用现有抽象

新增功能前先搜索同类实现，优先沿用项目已有结构：

- 导航入口使用 `LinkPreset` 和 `LinkPresets`，不要在 `src/config.ts` 里直接写裸 `{ name, url }` 对象。
- 导航文案走 `src/i18n/i18nKey.ts` 和 `src/i18n/languages/*.ts`，新增 key 必须补齐所有语言文件。
- URL 生成使用 `url()`、`getPostUrlBySlug()`、`getTagUrl()`、`getCategoryUrl()` 等现有工具。
- 页面优先复用 `MainGridLayout`，侧边栏能力优先放进 `src/components/widget/`。
- 内容集合统计优先放在 `src/utils/content-utils.ts`，不要在组件里重复读取和聚合文章数据。

### 目录边界

- `src/pages/`：Astro 路由入口，只负责页面组合。
- `src/components/`：可复用页面组件。
- `src/components/widget/`：侧边栏和浮层类组件。
- `src/data/`：静态数据，例如友链、工具入口。
- `src/content/posts/`：博客文章。
- `src/content/spec/`：关于页等独立内容。
- `src/i18n/`：导航、组件和系统文案翻译。

如果一个改动需要触碰构建配置、部署 workflow、内容 schema 或全局布局，必须在 PR 描述中说明原因和影响范围。

### 代码风格

- TypeScript 和 Astro frontmatter 遵循项目现有 Biome 规则。
- Astro 模板区域保持与现有文件一致的 4 空格缩进。
- 样式优先使用现有 Tailwind token 和项目类名，例如 `card-base`、`btn-plain`、`btn-regular`、`text-75`、`text-90`、`text-[var(--primary)]`。
- 不引入新的 UI 组件库，除非先说明取舍和维护成本。
- 不为未来可能的需求提前抽象。第二个真实使用场景出现后再提取公共逻辑。
- 不保留失效代码、临时代码、调试输出或注释掉的旧实现。

### 内容与资源

- 新文章必须包含完整 frontmatter：`title`、`published`、`description`、`tags`、`category`、`draft`。
- 正式发布的文章必须设置 `draft: false`。
- 外链图片必须确认可在站点中加载。遇到防盗链图床时，优先下载到文章同目录并使用相对路径。
- 不提交 `.env`、token、账号密钥、私有配置或未确认授权的素材。

## 提交要求

提交信息建议使用 Conventional Commits：

```text
feat: add friends page
fix: correct post image path
docs: update contribution guide
```

PR 或提交说明应包含：

- 改动目的
- 影响范围
- 验证命令和结果
- 已知残留风险；没有则写“无”

## 合并前检查清单

- [ ] 改动只解决一个明确问题
- [ ] 没有修改无关文件
- [ ] 已复用项目现有抽象，而不是绕过配置、i18n 或工具函数
- [ ] `pnpm check` 通过
- [ ] `pnpm build` 通过
- [ ] 涉及 `src/` 代码时，`pnpm exec biome check ./src` 通过
- [ ] 没有敏感信息和无关构建产物

## 发布说明

博客发布默认走快速发布：

```sh
pnpm publish-blog "Publish blog updates"
```

如果改动涉及构建配置、组件、workflow、依赖或部署路径，必须走全流程发布：

```sh
pnpm publish-blog --full "Publish blog updates"
```