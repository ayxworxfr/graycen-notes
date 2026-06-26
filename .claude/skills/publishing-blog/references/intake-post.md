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

检查 frontmatter 必填字段：

- `title`
- `published`
- `description`
- `tags`
- `category`
- `draft`

缺少信息时一次性询问用户，不要分多轮挤牙膏。推荐问题：

```text
这篇文章还缺这些发布信息：
- 文件名 slug：
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

## 3. 创建文件

根据 slug 创建文章：

```text
src/content/posts/<slug>.md
```

如果用户给的是 MDX 或内容需要组件，使用 `src/content/posts/<slug>.mdx`。

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

## 4. 内容整理

执行最小必要整理：

- 保留用户原意和语气
- 修正明显 Markdown 结构问题
- 补齐一级标题以外的章节层级
- 保留代码块语言标识
- 不擅自扩写用户没有提供的观点

如果用户只要求“发布”，不要大幅改写正文。

## 5. 交接发布

文章文件创建后，根据用户指定进入：

- 默认：快速发布，见 `quick-publish.md`
- 用户说“全流程 / 稳妥 / 检查 / 预览 / build”：全流程发布，见 `full-publish.md`

交接前列出：

- 创建或修改的文章路径
- frontmatter 关键字段
- 选择的发布模式
