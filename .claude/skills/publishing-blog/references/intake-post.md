# 接收文章内容

当用户直接贴一篇博客、Markdown、草稿或零散内容并要求发布时，先把内容变成项目内文章文件，再进入发布模式。

## 1. 识别输入

检查用户输入属于哪类：

- 完整 Markdown：含标题、正文、可能已有 frontmatter
- 半成品草稿：有正文但缺 frontmatter
- 零散素材：只有大纲、链接、代码片段或想法
- 已存在文件：用户指向 `src/content/posts/` 下的某个文件

阻断条件：输入不是博客内容且用户没有要求发布时，不要创建文章文件。

## 2. 补齐信息

检查 frontmatter 必填字段：`title`、`published`、`description`、`tags`、`category`、`draft`。

缺少信息时一次性询问用户，不要分多轮挤牙膏。缺少 topic 时先按标题自动推荐，不要默认让用户手填。推荐问题：

```text
这篇文章还缺这些发布信息：
- 文件名 topic（推荐：<topic-slug>）：
- 标题：
- 摘要 description：
- 标签 tags：
- 分类 category：
- 是否立即发布 draft=false：
```

默认值规则：

- `published` 默认用当天日期
- `draft` 默认 `false`，除非用户明确说先存草稿
- `tags` 缺失时必须询问，不要自行编造
- `category` 缺失时必须询问，不要自行编造
- `description` 可以基于正文生成，但生成后要展示给用户确认

## 3. 生成文件名

采用月份目录加主题文件名，目录按时间分组，文件名保持干净；MDX 文章把扩展名换成 `.mdx`：

```text
src/content/posts/YYYYMM/<topic-slug>.md
```

生成规则：

- 只使用小写英文、数字、连字符
- 月份目录来自 frontmatter 的 `published`
- 从标题提取 3-8 个关键词生成 slug
- 空格、下划线和标点统一替换成连字符
- 连续连字符压缩成一个，去掉首尾连字符
- 系列文章使用语义序号，例如 `202606/cursor-agent-skills-part-1.md`

冲突处理：

- 先检查 `src/content/posts/YYYYMM/<topic-slug>.md` 和同名目录是否存在
- 冲突时追加 `-2`、`-3`，直到找到可用名称
- 如果用户指定了固定文件名，冲突时必须询问是否改名、覆盖或编辑现有文件

阻断条件：生成文件名后没有检查冲突时，不允许创建文件。

## 4. 创建文件

写入完整 frontmatter：

```yaml
---
title: 文章标题
published: 2026-06-26
description: 文章摘要
image: ''
tags: [Tag]
category: 技术
draft: false
lang: ''
---
```

阻断条件：目标文件已存在时，先询问是否覆盖、改名或编辑现有文件；不要静默覆盖。

## 5. 内容整理

执行最小必要整理：保留用户原意和语气，修正明显 Markdown 结构问题，补齐章节层级，保留代码块语言标识，不擅自扩写用户没有提供的观点。

如果用户只要求“发布”，不要大幅改写正文。

## 6. 交接发布

文章文件创建后，根据用户指定进入：

- 默认：快速发布，见 `quick-publish.md`
- 用户说“全流程 / 稳妥 / 检查 / 预览 / build”：全流程发布，见 `full-publish.md`

交接前列出：创建或修改的文章路径、frontmatter 关键字段、选择的发布模式。
