---
title: AI 辅助开发主流玩法：Claude Code 与 Cursor 完整指南
published: 2026-06-26
description: 整理 Claude Code 与 Cursor 当前最主流的工作流配置和使用范式——CLAUDE.md、Skills、Hooks、Worktree、Rules、MCP 等实战玩法，不是 README 入门。
image: ''
tags: [AI, Claude Code, Cursor, 开发工具, Agent]
category: 技术
draft: false
lang: ''
---

> 距离"AI 写代码"从概念变成日常，不过两三年时间。但真正高效用好这两款工具的开发者，和把它们当搜索引擎用的开发者，生产力差距已经拉开了一个数量级。这篇文章整理了当前最主流的工作流配置和使用范式——不是 README 级别的入门，而是已经被大量开发者验证过的实战方式。

---

## 一、先搞清楚定位：Cursor vs Claude Code，不是竞争是分工

很多人纠结该用哪个，但 2026 年社区里一个趋势越来越清晰：**两者定位不同，主流用法是组合而非替换**。

**Cursor** 脱胎于 VSCode，继承了完整的 IDE 体验——文件树、插件生态、调试器全都在。它的优势是**低摩擦**：边写边问、Tab 补全、多文件 diff 一览无余，视觉反馈非常直观，适合"局部快速迭代"场景。它的上下文控制和干预能力也更细腻，改哪行、不改哪行，开发者随时可以接管。

**Claude Code** 是个纯终端 Agent。没有编辑器界面，直接在你的 shell 里跑，可以读文件、改文件、跑命令、推代码。它的优势是**深度自主**：交给它一个跨越十几个文件的重构任务，或者"给我写完这个模块的测试"，它会自己规划、执行、验证，你去泡杯咖啡回来看结果。代价是黑盒感更强，适合"大块任务批量交付"场景。

一个被很多团队采用的分工模式是：**Cursor 负责日常编写和探索，Claude Code 负责长会话的 Agentic 任务**——比如跨模块重构、测试套件生成、框架迁移。这不是非此即彼，是术业专攻。

---

## 二、Claude Code 的核心玩法

### 1. CLAUDE.md：给 AI 装上项目记忆

如果只能做一件事提升 Claude Code 的输出质量，那就是写好 `CLAUDE.md`。

这个文件放在项目根目录，Claude Code 每次启动都会读取它，相当于给 AI 注入项目上下文。一个实用的 `CLAUDE.md` 通常包含：

- **项目概览**：这是什么项目、主要技术栈、目录结构
- **代码规范**：命名风格、注释要求、禁止使用的 API 或模式
- **开发约定**：如何运行测试、构建命令、部署流程
- **常见陷阱**：这个项目里有哪些"雷"，比如某个目录不能随便改、某个配置文件格式很特殊

示例片段：

```markdown
# CLAUDE.md

## 项目简介
这是一个 Next.js 14 + Prisma + PostgreSQL 的 SaaS 应用。

## 技术约定
- 组件用函数式，不用 class component
- 数据库操作统一通过 `lib/db/` 下的 service 层，不在组件里直接调用 Prisma
- 测试用 Vitest，测试文件放在 `__tests__/` 目录

## 禁忌
- 不要修改 `prisma/migrations/` 下已有的迁移文件
- 不要在 server component 里引入客户端库
```

`CLAUDE.md` 支持层级：根目录是全局规则，子目录的 `CLAUDE.md` 覆盖局部规则。这意味着你可以给不同模块设置不同的 AI 行为规范。

---

### 2. Skills（技能）：固化你的高频流程

Skills 是 Claude Code 的"自定义斜杠命令"，本质是一段 Markdown 格式的指令模板，触发方式是 `/skill名称`。

官方生态和社区（如 [SkillsMP](https://skillsmp.com/)）已经积累了大量开箱即用的 Skill：

| Skill 示例 | 触发命令 | 用途 |
|---|---|---|
| `implement` | `/implement` | 按团队风格实现功能 |
| `simplify` | `/simplify` | 化简冗余代码 |
| `test` | `/test` | 生成单元测试 |
| `pr-description` | `/pr-description` | 自动生成 PR 描述 |
| `security-review` | `/security-review` | 安全漏洞扫描 |

Skills 存放在 `.claude/skills/` 目录，每个 Skill 是一个 Markdown 文件，里面描述"当触发这个命令时，你应该做什么、遵循哪些规则"。写法比 Prompt 工程更结构化，可以版本控制、团队共享。

它解决的核心问题是：**把你反复输入的那些复杂 Prompt，变成一个可复用、可维护的命令**。

---

### 3. Hooks：在 AI 行为的关键节点插入你的逻辑

Hooks 是 Claude Code 的自动化机制，在 Agent 执行流程的特定事件上触发你的脚本。

主要的 Hook 事件：

- `PreToolUse`：AI 准备调用某个工具（比如写文件、运行命令）之前触发
- `PostToolUse`：工具执行完之后触发
- `Stop`：Claude 完成一次回复时触发
- `Notification`：Agent 需要用户注意时触发

实际用法举几个例子：

**例1：防止 AI 直接改生产配置**

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write",
      "command": "if echo '$CLAUDE_TOOL_INPUT' | grep -q 'production'; then exit 2; fi"
    }]
  }
}
```

返回退出码 `2` 会让 Claude 收到错误信息并停下来重新考虑。

**例2：每次写完文件自动跑 lint**

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "command": "npm run lint -- $CLAUDE_TOOL_OUTPUT_FILE 2>&1"
    }]
  }
}
```

这样 AI 写完代码，lint 错误会立刻反馈给它，进入自动修复循环，而不需要你手动盯着。

**例3：Prompt Hook——用 AI 评估 AI**

Hooks 还支持一种特殊的"Prompt Hook"，调用一个轻量模型来判断当前操作是否合规。比如在 AI 要删除文件时，先问一下"这个删除操作合理吗"，再决定是否放行。

---

### 4. Git Worktree：真正的并行开发

这是 Claude Code 社区里讨论度最高的工作流之一，原理并不复杂：**Git Worktree 允许你从同一个仓库 checkout 出多个独立的工作目录**，每个目录对应一个 branch，互不干扰。

配合 Claude Code 使用时，好处立刻出来了：

```bash
# 创建三个并行工作区
git worktree add ../project-feature-auth feature/auth
git worktree add ../project-fix-perf fix/performance
git worktree add ../project-refactor-api refactor/api-layer

# 在三个目录里分别启动 Claude Code
cd ../project-feature-auth && claude
cd ../project-fix-perf && claude
cd ../project-refactor-api && claude
```

三个 Claude Code 实例同时跑，做完全不同的任务，上下文互不污染，不会出现"AI 把 feature 分支的改动带进了 hotfix"这种问题。

**关键优势**：

- 每个 session 的上下文是干净的，AI 不会被其他任务的信息"污染"
- 多任务真正并行，不是伪并行
- 合并时走正常 Git 流程，冲突范围可控

**适用场景**：需要同时推进多个独立任务时——比如一边修 bug、一边写新功能、一边做重构，这三件事没有依赖关系，完全可以并行跑三个 Agent。

一个实用建议：**worktree 的初始化成本不低**（需要重新安装依赖、复制未追踪的配置文件），所以不值得为了 10 分钟能完成的任务专门开一个 worktree。对于预计需要 30 分钟以上的任务，开 worktree 的收益就很明显了。

---

### 5. Subagents 与 Agent Teams：让 AI 管理 AI

Claude Code 支持 Agent 委派：主 Agent 可以把子任务分配给 Subagent，由 Subagent 独立执行后返回结果。

**Subagents** 的适用场景是"一个大任务里有多个独立的子问题"：

```
"帮我给这个项目生成完整测试套件"
  → 主 Agent 拆分任务
  → Subagent A：处理 auth 模块的测试
  → Subagent B：处理 API 路由的测试
  → Subagent C：处理 util 函数的测试
  → 主 Agent：汇总结果
```

**Agent Teams** 是更进一步的协作模式——预先定义多个有不同角色的 Agent（比如一个 Planner、一个 Coder、一个 Reviewer），让它们以流水线方式协作完成任务。

**什么时候值得用**：任务能清晰拆分成互不依赖的子任务、且每个子任务足够重（单独跑一个 Agent 划算）时，委派才有收益。对于逻辑紧密相连的任务，拆分带来的协调开销反而会降低质量。

---

### 6. MCP：接入外部世界

MCP（Model Context Protocol）是连接 Claude Code 与外部工具的标准协议。通过配置 MCP Server，Claude Code 可以直接操作：

- **GitHub**：搜索 PR、创建 issue、查看 diff
- **数据库**：直接查询、生成迁移脚本并验证
- **文档系统**：读取 Confluence、Notion 里的规范文档
- **监控系统**：拉取 Sentry 错误、查 Grafana 指标
- **Slack**：发送通知、搜索历史消息

配置方式是在 `~/.claude/claude_code_config.json` 中声明 MCP Server：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "your_token" }
    }
  }
}
```

配置后，Claude Code 可以在完成编码后自动创建 PR、填写描述、关联 issue——整个提交流程几乎不需要人工操作。

---

## 三、Cursor 的核心玩法

### 1. Rules：项目级 AI 行为规范

Cursor 的 Rules（原 `.cursorrules`）是 2026 年改版后最重要的配置机制。现在的规则文件是 `.mdc` 格式，存放在 `.cursor/rules/` 目录，支持 glob 模式按文件类型分别生效：

```
.cursor/rules/
├── general.mdc          # 全局规则
├── react-components.mdc # 只对 .tsx 文件生效
├── api-routes.mdc       # 只对 app/api/ 下的文件生效
└── test-files.mdc       # 只对 *.test.ts 生效
```

每个 `.mdc` 文件的 YAML 头部控制作用范围：

```yaml
---
globs: ["src/components/**/*.tsx"]
alwaysApply: false
---

## React 组件规范

- 使用 TypeScript，所有 props 必须有类型定义
- 组件文件同时导出类型和组件
- 不使用 default export，统一用 named export
- CSS 用 Tailwind，不引入额外的 CSS 文件
```

这比全局一刀切的规则精准得多——写测试文件时用测试相关的规范，写 API 路由时切换到后端规范。

---

### 2. Agent 模式：从"补全"到"自主执行"

Cursor 的 Agent 模式（Composer）是它的核心功能。和普通的 Chat 不同，Agent 模式可以：

- 跨多个文件做修改
- 执行终端命令
- 读取报错信息并自动修复
- 在任务完成前持续循环，直到验证通过

**2026 年的 Background Agents** 更进一步——你不需要盯着 Cursor 界面，Agent 在后台跑，你可以继续做别的事，它完成后通知你。

实践中一个有效的工作流是"Plan → Execute → Review"三段式：

1. 先让 Agent 输出执行计划，**不执行**，你审阅并修改
2. 确认计划后，让它执行
3. 执行完成后做 diff review，必要时局部回退

这在 Cursor 里通过"让 Agent 先描述它要做什么"来实现，避免 Agent 跑偏了你还不知道。

---

### 3. Skills（Cursor）：跨工具复用的能力单元

Cursor 也引入了 Skills 体系，格式采用 `SKILL.md`，和 Claude Code 的 Skills 格式相近，目的是**让同一套能力描述在不同 AI 工具间可以复用**。

这解决了一个现实问题：你精心写好的 Cursor 规则，换到 Claude Code 就得重写。Skills 的标准化格式让这个工作量降低了。

---

### 4. MCP：和 Claude Code 共用同一套工具生态

Cursor 对 MCP 的支持已经相当成熟，配置方式和 Claude Code 高度一致。这意味着你给 Claude Code 配好的 GitHub MCP Server、数据库 Server，在 Cursor 里改改配置就能复用。

6 个最值得配的 MCP Server（两款工具通用）：

| MCP Server | 用途 |
|---|---|
| `github-mcp-server` | PR/Issue/代码搜索 |
| `filesystem` | 安全的文件系统访问 |
| `postgres` / `sqlite` | 数据库直接操作 |
| `brave-search` | 实时网络搜索 |
| `sentry` | 错误监控接入 |
| `slack` | 消息通知与搜索 |

---

## 四、两者通用的工作流原则

### 给 AI 的任务颗粒度要对

太大："帮我重构整个后端"——AI 会迷失方向，产出质量不稳定。
太小："把这个变量名从 x 改成 count"——不值得调用 Agent，直接手写更快。

**合适的颗粒度**：一个功能点、一个模块的测试、一个具体的 bug 修复。能在一个上下文窗口内完成、有清晰的验收标准——这是给 AI 任务的黄金区间。

### 验收标准要前置

"帮我实现用户登录功能"不如"帮我实现用户登录功能，要求：通过 `npm test` 里的 auth 相关测试，错误信息要符合 `docs/error-codes.md` 的规范"。

前置验收标准，AI 才知道什么叫"完成"，才会主动验证而不是生成完就交差。

### 上下文污染是隐形杀手

一个 Claude Code session 跑太长之后，早期的错误信息、半途放弃的方向会慢慢干扰后续决策。认知到这一点后，**适时开新 session 而不是在一个 session 里硬撑**，是保持 AI 输出质量稳定的重要习惯。Worktree 模式的优势之一，就是每个任务天然有独立的干净上下文。

### 版本控制是安全网，不是事后补救

让 AI 大规模改代码之前，先 commit 当前状态——这几乎是所有重度用户的共识。不是不信任 AI，而是给自己保留随时回退的能力。用 AI 开发的节奏比手写快很多，出了问题如果没有 checkpoint，回溯的成本会非常高。

---

## 五、选型参考

不同场景下，哪款工具更适合：

| 场景 | 推荐工具 | 原因 |
|---|---|---|
| 日常功能开发、局部修改 | Cursor | IDE 原生体验，干预灵活 |
| 大规模重构、跨模块任务 | Claude Code | 自主性强，适合长任务 |
| 多任务并行推进 | Claude Code + Worktree | 真并行，上下文隔离 |
| 需要接入外部系统（DB/GitHub） | 两者均可（MCP 通用） | 配置可复用 |
| 团队统一规范 | Cursor Rules + CLAUDE.md | 两者各有格式，可共存 |
| 移动端、无本地环境 | Claude Code Web | Anthropic 已上线 Web 版 |

---

## 结语

工具本身的能力已经不是瓶颈了。把 `CLAUDE.md` 写清楚、把高频流程固化成 Skills、用 Hooks 关掉那些让 AI 反复犯错的"漏洞"、在需要并行时拉起 Worktree——这些配置投入一次，之后每次开发都在收益。

AI 编程工具的上限，越来越取决于你给它搭的环境，而不只是它本身的模型能力。
