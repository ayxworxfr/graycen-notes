---
title: 'Claude Code & Codex 使用技巧大全：从入门到精通'
published: 2026-07-02
description: '终端级 AI 编程工具已成为开发者的核心生产力。本文系统整理 Claude Code 和 OpenAI Codex 的实战技巧，帮你少踩坑、省 Token、提效率。'
image: ''
tags: [AI, Claude Code, Codex, 开发工具, 终端工具]
category: 技术
draft: false
lang: ''
---

> 终端级 AI 编程工具已成为开发者的核心生产力。本文系统整理 Claude Code 和 OpenAI Codex 的实战技巧，帮你少踩坑、省 Token、提效率。

---

## 一、Claude Code 使用技巧

### 基础篇

#### 1. 把需求说具体

AI 上下文有限制，代码量太长可能输出不全甚至被截断。

```markdown
❌ 差：帮我写一个用户管理系统
✅ 好：帮我写一个用户注册接口，使用 Express + TypeScript，
       包含邮箱验证、密码哈希（bcrypt）、JWT 返回，
       错误统一用 ApiError 类抛出
```

#### 2. 先理解项目再开动

在修改代码之前，先让 Claude 理解你的代码：

```bash
> 阅读这个项目的代码结构，理解各模块的职责和依赖关系
> 这个项目的数据流是怎样的？从请求到响应经过哪些层？
> src/services/ 目录下的服务之间有什么依赖关系？
```

#### 3. 分步执行复杂任务

每一步完成后你都可以先 review/测试，再让 AI 执行下一步：

```bash
# 第一步
> 先帮我分析当前支付模块的问题

# 确认后
> 好的，按照你的分析，先重构 PaymentService 类

# 验证后
> 通过了，接下来处理 OrderService 的适配
```

#### 4. 善用深度思考模式

在 Claude Code 中使用 **"think"** 关键词激活深度思考：

```bash
> think about how to refactor this authentication module
> think harder about the race condition in this code
> ultrathink about the architecture for this distributed system
```

| 级别 | 关键词 | 适用场景 |
|------|--------|----------|
| 普通思考 | `think` | 一般分析 |
| 深度思考 | `think harder` | 复杂逻辑 |
| 超级思考 | `ultrathink` | 架构级决策 |

---

### 进阶篇

#### 5. 配置 CLAUDE.md 记忆文件

`CLAUDE.md` 是 Claude Code 自动读取的记忆文件，类似 Cursor 的 rules，但更强大：

```markdown
# CLAUDE.md

## 项目概述
这是一个基于 Next.js 14 的电商平台，使用 App Router。

## 技术栈
- Frontend: React 18 + TypeScript + Tailwind CSS
- Backend: Next.js API Routes + Prisma + PostgreSQL
- Auth: NextAuth.js v5

## 代码规范
- 使用 Conventional Commits
- 组件使用 PascalCase，工具函数使用 camelCase
- 所有 API 返回统一格式：`{ success, data, error }`

## 重要约束
- 不要修改 /src/core/ 下的文件
- 数据库迁移必须向后兼容
- 所有新接口必须有单元测试
```

可以在多个位置放置 `CLAUDE.md` 文件，Claude Code 会递归读取：

```
~/CLAUDE.md                    # 全局（所有项目生效）
./CLAUDE.md                    # 项目根目录
./src/CLAUDE.md                # 子目录（更具体的规则）
./src/components/CLAUDE.md     # 更深层级
```

#### 6. 跳过权限确认（Bypass Mode）

每次都要点确认太烦了：

```bash
# 单次启动
claude --dangerously-skip-permissions

# 设置别名（推荐）
alias cc='claude --dangerously-skip-permissions'
echo "alias cc='claude --dangerously-skip-permissions'" >> ~/.zshrc
```

> ⚠️ 注意：这相当于 Cursor 的老 YOLO 模式。理论上有风险，但实际使用中极少出问题。

#### 7. 模型切换

Claude Code 支持模型灵活切换：

```bash
/model              # 查看当前模型
/model opus         # 切换到 Claude Opus（Max 用户）
/model sonnet       # 切换回 Claude Sonnet（推荐）
```

> 💡 **强烈推荐 Sonnet**：体验与 Opus 差别不大，但计费仅为 1/5。

#### 8. 对话式 Git 操作

不用记繁琐的 Git 命令：

```bash
> 帮我把这次改动提交，用 conventional commit 格式
> 创建一个新分支 feature/payment-refactor，把最近3次提交 cherry-pick 过去
> 帮我 rebase 到 main，有冲突的话保留我的改动
```

#### 9. 非交互模式（单次执行）

适合脚本化和 CI/CD 集成：

```bash
# 单次执行后退出
claude -p "列出 src/ 下所有超过 200 行的 TypeScript 文件"

# 管道模式
cat error.log | claude -p "分析这个错误日志，找出根因"

# 结合其他工具
git diff HEAD~3 | claude -p "总结这3次提交的改动，写成 changelog"
```

---

### 高级篇

#### 10. 配置 Hooks（生命周期钩子）

Hooks 是在特定事件中自动运行的 shell 命令：

```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $CLAUDE_FILE_PATH"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "say \"job's done!\""
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "terminal-notifier -message 'Claude needs input' -title 'Claude Code'"
          }
        ]
      }
    ]
  }
}
```

实用 Hook 场景：

| Hook 事件 | 用途示例 |
|-----------|---------|
| `PreToolUse` | 拦截敏感文件操作（`.env`、secrets） |
| `PostToolUse` (Write) | 自动格式化、自动运行测试 |
| `Stop` | 任务完成后系统通知 |
| `Notification` | Claude 需要输入时弹窗提醒 |

#### 11. 自定义命令（Slash Commands）

创建项目级快捷命令：

```markdown
<!-- .claude/commands/commit.md -->
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Create a conventional commit from current changes

分析当前 git diff，写一个 Conventional Commit：
- subject <= 72 chars
- 简洁的 body 描述为什么改
- Stage 相关文件并提交
```

```markdown
<!-- .claude/commands/frontend/component.md -->
description: Generate a React component with tests

创建一个 React 组件：
- 使用 TypeScript + Tailwind CSS
- 包含 Props 接口定义
- 生成对应的 .test.tsx 文件
- 导出到 index.ts barrel file
```

使用方式：

```bash
/commit
/frontend/component UserProfile
```

#### 12. 配置项目级 Agent

定义具有特定角色的智能体：

```markdown
<!-- .claude/agents/code-reviewer.md -->
# Code Reviewer Agent

## 角色
你是一个严格的代码审查员。

## 工具限制
仅允许：Read, Search, Grep
禁止：Write, Edit, Bash

## 审查标准
- 安全漏洞（SQL注入、XSS、SSRF）
- 性能问题（N+1查询、内存泄漏）
- 类型安全（any 的使用）
- 错误处理（未捕获的 Promise）
```

#### 13. MCP 连接外部服务

使 Claude 能连接 Jira、GitHub、Notion、Sentry 等：

```bash
# 连接后可以直接说：
> 实现 JIRA-ENG-4521 中描述的功能
> 查看 Sentry 上最近的报错，分析根因
> 把这个方案同步到 Notion 的技术文档中
```

#### 14. 安全防护 Hook

防止 AI 误操作敏感文件：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 - <<'PY'\nimport json,sys\np=json.load(sys.stdin).get('tool_input',{}).get('file_path','')\nblock=['.env','/secrets/','.git/']\nsys.exit(2 if any(b in p for b in block) else 0)\nPY"
          }
        ]
      }
    ]
  }
}
```

#### 15. 状态栏自定义

在终端显示项目状态信息：

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh"
  }
}
```

---

## 二、Codex 使用技巧

### 基础篇

#### 1. 提供清晰的代码上下文

在提示中加入函数名、类名或代码片段，帮助 Codex 快速定位：

```bash
codex "在 UserService.createUser() 方法中添加邮箱格式验证，
       验证失败抛出 ValidationError"
```

#### 2. 设置高推理等级

默认推理等级为中等，复杂任务建议提高：

```bash
# 单次使用
codex --model gpt-5-codex -c model_reasoning_effort="high"

# 别名（推荐）
alias codex='codex -m gpt-5-codex -c model_reasoning_effort="high" -c model_reasoning_summary_format=experimental --search --dangerously-bypass-approvals-and-sandbox'
```

#### 3. 拆分大型任务

将复杂任务分解为小步骤，让 Codex 更容易处理和测试：

```bash
# 不要这样
codex "重构整个项目的认证系统"

# 这样做
codex "第一步：分析当前 auth 模块的依赖关系"
codex "第二步：将 JWT 逻辑从 Controller 抽到 AuthService"
codex "第三步：添加 refresh token 机制"
```

#### 4. 用于调试

把详细日志或错误堆栈粘贴进去，让 Codex 并行分析：

```bash
codex "分析以下错误堆栈，找出根因并修复：
$(cat /tmp/error.log)"
```

---

### 进阶篇

#### 5. 初始化 AGENTS.md

类似 Claude Code 的 CLAUDE.md，为 Codex 提供项目上下文：

```bash
codex /init    # 自动生成 AGENTS.md
```

`AGENTS.md` 示例：

```markdown
# AGENTS.md

## 项目信息
- 语言：TypeScript
- 框架：NestJS + Prisma
- 测试：Jest + Supertest

## 构建命令
- 安装依赖：pnpm install
- 运行测试：pnpm test
- 构建：pnpm build

## 代码风格
- 使用 ESLint + Prettier
- import 排序：内置 → 第三方 → 本地
- 每个模块一个目录，包含 controller/service/dto/entity

## 约束
- 不要使用 any 类型
- 所有数据库操作必须在 Service 层
- Controller 只做参数校验和响应格式化
```

#### 6. 权限模式选择

根据场景选择合适的安全级别：

| 模式 | 命令 | 适用场景 |
|------|------|----------|
| 只读 | `--sandbox read-only --ask-for-approval never` | 代码审查、分析 |
| 自动编辑 | `--sandbox workspace-write --ask-for-approval untrusted` | 日常开发 |
| 全自动 | `--dangerously-bypass-approvals-and-sandbox` | 信任环境下的批量任务 |

#### 7. 通过 API 使用（免费账户）

没有订阅也能用：

```bash
# 切换为 API 认证方式
codex --config preferred_auth_method="apikey"

# 切换回 ChatGPT 订阅认证
codex --config preferred_auth_method="chatgpt"
```

#### 8. 尝试开放式提示

不仅限于具体编码任务：

```bash
codex "审查 src/services/ 下的所有文件，找出潜在的安全漏洞"
codex "为这个项目的 README 补充 API 文档"
codex "头脑风暴：这个模块有哪些性能优化空间？"
codex "清理 dead code，找出未使用的导出"
```

---

### 高级篇

#### 9. 配置 MCP 服务器

在 Codex 中使用 MCP 扩展能力：

```json
// codex 配置文件
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

#### 10. 模型选择策略

Codex 支持多种模型：

| 模型 | 适用场景 | 命令 |
|------|----------|------|
| `gpt-5-codex` | 代码专用（默认，最强） | `-m gpt-5-codex` |
| `gpt-5` | 通用任务 | `-m gpt-5` |
| `o3` | 长链推理 | `-m o3` |
| `o4-mini` | 轻量快速 | `-m o4-mini` |

```bash
# 高推理 + 高级模型
codex -m gpt-5-codex -c model_reasoning_effort="high"

# 快速简单任务
codex -m o4-mini -c model_reasoning_effort="low"
```

#### 11. 自定义工作方式

告诉 Codex 使用特定提交规范、遵循模板或避免某些命令：

```bash
codex "修复这个 bug，但是：
- 不要使用 git force push
- commit message 使用 fix: 前缀
- 修改后运行 pnpm test 确认通过
- 不要修改 package.json"
```

#### 12. 启用搜索功能

让 Codex 联网查找最新文档和解决方案：

```bash
codex --search "使用最新版 Prisma 5.x 的语法重写这个查询"
```

---

## 三、通用最佳实践

### 1. Prompt 工程核心原则

两个工具通用的提示技巧：

```markdown
📌 一句话总结：
写提示时要「明确上下文 + 给出验证方法 + 合理拆解任务 + 灵活定制」
```

| 原则 | Claude Code | Codex |
|------|-------------|-------|
| 明确上下文 | CLAUDE.md + 对话开头 | AGENTS.md + 提示内 |
| 给出验证方法 | "运行 pnpm test 确认" | "通过现有测试套件" |
| 合理拆解 | 分步对话 | 拆分多次调用 |
| 灵活定制 | Hooks + Commands | Config + Flags |

### 2. 工作循环认知

两个工具的核心工作循环是相同的：

```
┌─────────────────────────────────────────┐
│  1. 收集上下文（看代码、文件、错误信息）   │
│           ↓                              │
│  2. 采取行动（编辑文件、运行命令、搜索）   │
│           ↓                              │
│  3. 验证结果（运行测试、检查输出）         │
│           ↓                              │
│  4. 循环直到完成                          │
└─────────────────────────────────────────┘
```

### 3. 省 Token 的通用技巧

| 技巧 | 效果 | 适用工具 |
|------|------|----------|
| 写好记忆文件 | 减少重复解释项目背景 | 两者 |
| 先 Plan 再执行 | 减少无效生成和回滚 | 两者 |
| 及时清理上下文 | 避免长对话 Token 爆炸 | Claude Code |
| 任务描述一次到位 | 减少 retry 和追问 | Codex |
| 用只读模式做分析 | 避免不必要的写操作 | 两者 |

### 4. 选择建议

| 场景 | 推荐 | 原因 |
|------|------|------|
| 需要深度理解大项目 | Claude Code | 项目级上下文理解最强 |
| 批量自动化任务 | Codex | 异步执行 + 云端沙盒 |
| 需要联网搜索资料 | Codex | 内置搜索功能 |
| 代码审查 | Claude Code | MCP + 自定义 Agent |
| 调试复杂 bug | 两者皆可 | Claude Code 更擅长推理 |
| CI/CD 集成 | 两者皆可 | 都支持非交互模式 |

---

## 四、速查对照表

| 功能 | Claude Code | Codex |
|------|-------------|-------|
| 记忆文件 | `CLAUDE.md` | `AGENTS.md` |
| 跳过确认 | `--dangerously-skip-permissions` | `--dangerously-bypass-approvals-and-sandbox` |
| 初始化配置 | 手动创建 | `/init` |
| 深度思考 | `think` / `think harder` | `-c model_reasoning_effort="high"` |
| 模型切换 | `/model` | `--model` / `-m` |
| 非交互模式 | `claude -p "..."` | `codex "..."` |
| 自定义命令 | `.claude/commands/*.md` | AGENTS.md 内定义 |
| 外部服务 | MCP 协议 | MCP + 内置搜索 |
| Hook 系统 | `.claude/settings.json` hooks | 暂无原生支持 |
| 上下文压缩 | `/compact` | 自动管理 |
| 会话恢复 | `--resume` | 线程持久化 |

---

## 五、总结

**Claude Code** 像一个经验丰富的高级工程师——理解全局、善于重构、注重架构。

**Codex** 像一个高效的执行团队——批量处理、异步运行、自动验收。

两者并不冲突，最高效的方式是**组合使用**：

```
复杂设计 → Claude Code /plan
         ↓
执行重构 → Claude Code /goal 或 Codex 批量任务
         ↓
代码审查 → Claude Code Agent
         ↓
批量修复 → Codex 异步并行
```

### 核心心法

1. **上下文为王**——写好 CLAUDE.md / AGENTS.md
2. **分步为安**——拆分任务，逐步验证
3. **先理解后动手**——让 AI 先读代码再改代码
4. **验证闭环**——每次改动都要有测试确认

---

*AI 不会淘汰程序员，但不会用 AI 的除外。会用 AI 的程序员才有未来！*
