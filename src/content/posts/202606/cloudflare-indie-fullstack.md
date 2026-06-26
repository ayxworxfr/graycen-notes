---
title: 用 Cloudflare 全家桶做独立产品：Pages + Workers 零成本全栈方案
published: 2026-06-26
description: 独立开发者冷启动阶段的零成本全栈方案——Pages 托管前端，Workers 处理持久化与安全操作，D1/KV 存数据，免费额度足够撑过 MVP 验证期。
image: ''
tags: [Cloudflare, Workers, 独立开发, 全栈, MVP]
category: 技术
draft: false
lang: ''
---

> 适合人群：想验证产品 MVP、不想在冷启动阶段花服务器钱的独立开发者

## 前言

很多独立开发者面临一个共同困境：产品的核心逻辑其实很简单，前端就能搞定大部分交互，但只要涉及「存用户数据」「发邮件」「生成订单号」这类事情，就不得不租一台服务器——每月几十到几百元，在产品还没验证市场前，这笔钱心里很虚。

Cloudflare 提供了一个优雅的解法：**Pages + Workers + D1/KV**，前后端都在 Cloudflare 边缘网络上，免费额度足够大多数早期产品撑过冷启动阶段。

## APP推广页

**实现效果：** [https://musiclab.pages.dev/zh](https://musiclab.pages.dev/zh)

**推广页脚手架：** [https://github.com/ayxworxfr/indie-launch-kit](https://github.com/ayxworxfr/indie-launch-kit)

> 无需编码，修改配置文件 5 分钟快速构建自己的 APP 宣传页

![APP 推广页示例](https://i-blog.csdnimg.cn/direct/80327a03390745a88cc65a34773be511.png)

---

## 整体架构

```
用户浏览器
    │
    ▼
Cloudflare Pages（静态前端）
    │  核心业务逻辑在前端完成
    │  如：产品展示、定价计算、表单校验、 UI 交互
    │
    ▼  只在需要「持久化」或「安全操作」时才调用后端
Cloudflare Workers（轻量 API）
    │
    ├── D1（SQLite 数据库）  → 存用户信息、订单记录
    ├── KV（键值存储）        → 存会员码、邮件验证码、配置项
    ├── 邮件服务              → 对接 Resend / MailChannels
    └── 支付回调              → 对接 Stripe / Lemon Squeezy Webhook
```

**核心原则：能在前端做的，绝不往后端甩。** Workers 只负责四件事：

1. 写入 / 读取数据库（用户注册、订单记录）
2. 生成唯一码（会员码、激活码、邀请码）
3. 发送邮件通知（注册确认、付款成功）
4. 处理第三方支付回调（验证签名、更新会员状态）

---

## 为什么这个组合适合独立开发者

### 费用对比

| 方案 | 月费估算 | 适合阶段 |
|---|---|---|
| 传统 VPS（2核4G） | ¥50–200 | 成熟产品，流量稳定 |
| Vercel + PlanetScale | $0–20 | 中期，有一定用户量 |
| **Cloudflare Pages + Workers** | **$0（免费额度内）** | **冷启动 / MVP 验证** |

### Cloudflare 免费额度

| 服务 | 免费额度 | 说明 |
|---|---|---|
| Pages | 无限带宽，500次构建/月 | 静态托管完全够用 |
| Workers | 10万次请求/天 | 日活过万才需要付费 |
| D1 数据库 | 5GB 存储，500万行读/天 | 早期产品完全够 |
| KV 存储 | 10万次读/天，1000次写/天 | 存会员码足够 |

早期产品日活通常在几十到几百，上面的额度**几乎永远用不完**。

### 网速优势

- Cloudflare 在全球 300+ 城市有节点，包括香港、东京
- 国内访问 Cloudflare Pages 比 GitHub Pages 稳定得多
- Workers 在边缘执行，延迟极低（通常 < 50ms）

---

## 典型使用场景拆解

### 场景一：用户留资（邮件订阅）

```
前端：表单收集邮箱 + 前端校验格式
  ↓
Workers：写入 D1 数据库 + 发确认邮件
  ↓
完成：用户进入你的早期用户列表
```

Workers 代码示例：

```typescript
// src/api/subscribe.ts
export async function handleSubscribe(request: Request, env: Env) {
  const { email } = await request.json();

  // 写入数据库
  await env.DB.prepare(
    'INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?, ?)'
  ).bind(email, new Date().toISOString()).run();

  // 发确认邮件（对接 Resend）
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@yourdomain.com',
      to: email,
      subject: '订阅成功',
      html: '<p>感谢订阅，我们会在产品上线时第一时间通知你。</p>',
    }),
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
```

### 场景二：生成会员激活码

```
用户付款成功（Stripe Webhook 触发）
  ↓
Workers：验证支付签名 → 生成唯一激活码 → 存入 KV → 发邮件给用户
  ↓
用户收到激活码，在前端输入后验证（Workers 查 KV）
```

激活码生成示例：

```typescript
// 生成 16 位大写字母+数字的激活码
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  );
  return segments.join('-'); // 格式：XXXX-XXXX-XXXX-XXXX
}

// 存入 KV，value 存用户邮箱，key 是激活码
await env.LICENSE_KV.put(licenseKey, email, {
  metadata: { plan: 'pro', activatedAt: null }
});
```

### 场景三：激活码校验

```
前端：用户输入激活码
  ↓
Workers：查 KV → 返回是否有效 + 已激活状态
  ↓
前端：解锁对应功能（如果核心功能在前端）
```

---

## 这套方案的边界和局限

诚实说，这套方案**不是万能的**，有几个明显限制：

### 适合做的事

- 静态内容展示（Landing Page、文档、博客）
- 轻量数据持久化（用户留资、订单记录、激活码）
- 简单 API（CRUD、邮件发送、Webhook 接收）

### 不适合做的事

- **实时性要求高**：WebSocket 长连接（聊天、协同编辑），Workers 不擅长
- **复杂计算**：Workers 有 CPU 时间限制（免费版 10ms），机器学习推理等跑不了
- **大文件处理**：视频转码、图片处理，需要配合 Cloudflare R2 + Images
- **有状态会话**：传统 Session 模式需要改成 JWT 或 KV 存 Token

### 安全注意事项

- 激活码校验、支付验证等**必须在 Workers 里做**，不能完全依赖前端
- 敏感密钥（API Key、数据库密码）通过 Workers 的 `env` 绑定，不要写死在代码里
- 前端的「解锁功能」只能做体验层，真正的权限控制要在服务端

---

## 快速上手

### 1. 初始化 Workers 项目

```bash
npm create cloudflare@latest my-api
cd my-api
```

### 2. 绑定 D1 数据库

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "xxxx-xxxx-xxxx"
```

### 3. 部署

```bash
# 部署 Workers
npx wrangler deploy

# 前端推送 GitHub 后 Cloudflare Pages 自动构建部署
git push origin main
```

### 4. 前端调用 Workers API

```typescript
// 前端调用示例
const res = await fetch('https://my-api.your-name.workers.dev/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: userEmail }),
});
```

---

## 总结

| 维度 | 评价 |
|---|---|
| 上手难度 | ⭐⭐⭐（比 VPS 简单，比纯前端复杂一点）|
| 免费额度 | ⭐⭐⭐⭐⭐（早期产品几乎零成本）|
| 国内访问速度 | ⭐⭐⭐⭐（比 GitHub Pages 强，比国内云差）|
| 扩展性 | ⭐⭐⭐（够用，大规模需迁移）|
| 适合场景 | MVP 验证、个人工具、小型 SaaS 早期版本 |

**一句话结论**：如果你的产品核心是前端体验，后端只是做数据落地，Cloudflare Pages + Workers 是目前独立开发者冷启动阶段性价比最高的方案，没有之一。

---

## 项目地址

[https://github.com/ayxworxfr/indie-launch-kit](https://github.com/ayxworxfr/indie-launch-kit)

## 参考链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [D1 数据库入门](https://developers.cloudflare.com/d1/)
- [Workers KV 文档](https://developers.cloudflare.com/kv/)
- [Resend 邮件服务](https://resend.com)
