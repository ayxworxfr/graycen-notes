---
title: Ubuntu 安装 V2RayA 完整教程
published: 2026-07-11
description: 在 Ubuntu 20.04+ 上通过手动方式安装 V2RayA + Xray 核心，含国内 GitHub 镜像下载、服务启动、Web 面板配置、订阅导入排错与代理验证。
image: ''
tags: [Ubuntu, V2RayA, Xray, Linux, 代理]
category: 技术
draft: false
lang: ''
---

> **环境：** Ubuntu 20.04+ / Debian 系  
> **架构：** amd64 (x86_64)  
> **日期：** 2026年7月  

---

## 一、前言

[V2RayA](https://github.com/v2rayA/v2rayA) 是一个易用的代理客户端，支持 V2Ray / Xray 内核，提供 Web GUI 管理界面，适合在 Linux 服务器或桌面环境中使用。

本文记录在 Ubuntu 上通过 **手动方式** 安装 V2RayA + Xray 核心的全过程，适用于无法直接访问 GitHub 的国内服务器环境。

---

## 二、安装 Xray 核心

V2RayA 本身只是客户端前端，需要搭配代理内核使用。这里选择 **Xray-core**。

### 2.1 下载 Xray

```bash
# 通过 GitHub 镜像下载（国内服务器推荐）
sudo wget -O /tmp/xray.zip https://ghfast.top/https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip
```

> **💡 提示：** 如果 `ghfast.top` 失效，可替换为其他镜像：
> - `https://ghproxy.cc/`
> - `https://gh-proxy.com/`
> - `https://hub.gitmirror.com/`
>
> 如果服务器能直连 GitHub，去掉镜像前缀直接下载即可。

### 2.2 验证下载文件

```bash
ls -lh /tmp/xray.zip    # 正常约 20MB
file /tmp/xray.zip       # 应显示 "Zip archive data"
```

### 2.3 解压并安装

```bash
sudo rm -rf /tmp/xray
sudo unzip -o /tmp/xray.zip -d /tmp/xray/
sudo install -Dm755 /tmp/xray/xray /usr/local/bin/xray
```

### 2.4 安装 GeoIP / GeoSite 数据文件

Xray 路由规则依赖这两个 `.dat` 文件：

```bash
sudo mkdir -p /usr/local/share/xray

# 方法一：使用解压出来的文件（推荐）
sudo cp /tmp/xray/geoip.dat /usr/local/share/xray/
sudo cp /tmp/xray/geosite.dat /usr/local/share/xray/

# 方法二：单独下载（如解压包中没有）
# sudo wget -O /usr/local/share/xray/geoip.dat https://ghfast.top/https://github.com/v2fly/geoip/releases/latest/download/geoip.dat
# sudo wget -O /usr/local/share/xray/geosite.dat https://ghfast.top/https://github.com/v2fly/domain-list-community/releases/latest/download/dlc.dat
```

### 2.5 验证安装

```bash
xray version
```

预期输出：

```
Xray 26.3.27 (Xray, Penetrates Everything.) d2758a0 (go1.26.1 linux/amd64)
A unified platform for anti-censorship.
```

---

## 三、安装 V2RayA

### 3.1 下载 deb 安装包

```bash
sudo wget -O /tmp/v2raya.deb https://ghfast.top/https://github.com/v2rayA/v2rayA/releases/download/v2.2.6.3/installer_debian_x64_2.2.6.3.deb
```

> **📌 注意：** `v2.2.6.3` 为撰文时的最新版本，请前往 [Releases 页面](https://github.com/v2rayA/v2rayA/releases) 确认最新版本号。

### 3.2 验证下载文件

```bash
ls -lh /tmp/v2raya.deb
file /tmp/v2raya.deb     # 应显示 "Debian binary package"
```

### 3.3 安装

```bash
sudo dpkg -i /tmp/v2raya.deb
```

如遇依赖缺失报错：

```bash
sudo apt --fix-broken install -y
```

---

## 四、启动服务

```bash
# 启动并设为开机自启
sudo systemctl enable --now v2raya

# 查看运行状态
sudo systemctl status v2raya
```

正常输出中应看到 `Active: active (running)`。

---

## 五、访问 Web 管理面板

V2RayA 默认监听 **2017** 端口：

```
http://<服务器IP>:2017
```

本机访问：

```
http://127.0.0.1:2017
```

首次访问需要 **创建管理员账户**，设置用户名和密码后即可进入管理界面。

> **⚠️ 安全提醒：** 如果是云服务器，请确保安全组/防火墙放通 2017 端口，或通过 SSH 隧道访问：
> ```bash
> ssh -L 2017:127.0.0.1:2017 user@your-server-ip
> ```
> 然后本地浏览器打开 `http://127.0.0.1:2017`

---

## 六、导入订阅与节点连接

### 6.1 导入订阅

在 Web 面板中点击 **Import** → 粘贴订阅地址 → 点击确认。

导入成功后节点会显示在 SERVER 列表中。

### 6.2 连接节点

1. 勾选要连接的节点（建议不超过 4 个）
2. 点击左上角 **"就绪"** 按钮启动连接
3. 状态变为 **"正在运行"**（橙色标签）即为连接成功

### 6.3 代理模式设置

在 **Setting** 中可选择：

- **透明代理**：系统全局走代理（推荐服务器使用）
- **系统代理**：仅配置系统代理变量
- **不设置**：手动指定代理端口使用

---

## 七、验证代理 & 测试延迟

### 7.1 验证代理是否生效

V2RayA 默认代理端口：HTTP `20171`、SOCKS5 `20170`。

```bash
# 通过代理查询出口 IP（最直观的验证方式）
curl -x http://127.0.0.1:20171 https://ipinfo.io
```

预期返回代理节点所在地区的 IP 信息：

```json
{
  "ip": "x.x.x.x",
  "city": "Hong Kong",
  "region": "Hong Kong",
  "country": "HK",
  "org": "AS4760 HKT Limited",
  ...
}
```

> 如果返回的 `country` 字段与所选节点地区一致，说明代理工作正常。

### 7.2 测试代理延迟

```bash
# 测量通过代理访问 Google 的总耗时
curl -x http://127.0.0.1:20171 -o /dev/null -s -w "延迟: %{time_total}s\n" https://www.google.com
```

### 7.3 测试能否正常访问被墙网站

```bash
# 访问 Google
curl -x http://127.0.0.1:20171 -I https://www.google.com

# 访问 GitHub
curl -x http://127.0.0.1:20171 -I https://github.com
```

返回 `HTTP/2 200` 即表示访问成功。

### 7.4 V2RayA 面板内测延迟

1. 在 Web 面板中勾选节点（或全选）
2. 点击上方 **"HTTP"** 按钮触发延迟测试
3. 时延列会显示 ms 数值，超时则显示 `timeout`

### 7.5 设置环境变量后直接使用

```bash
# 设置代理环境变量（当前终端生效）
export http_proxy=http://127.0.0.1:20171
export https_proxy=http://127.0.0.1:20171

# 之后所有命令自动走代理
curl https://www.google.com -I
git clone https://github.com/some/repo.git
wget https://some-blocked-resource.com/file.tar.gz

# 取消代理
unset http_proxy https_proxy
```

> **💡 持久化：** 如需每次登录自动生效，将 export 语句写入 `~/.bashrc` 或 `~/.profile`。

---

## 八、订阅导入常见问题排错

### 问题现象

导入订阅后 **没有节点显示**，或提示解析失败。

### 排查步骤

#### Step 1：检查订阅地址是否可达

```bash
curl -sL "你的订阅地址" | head -c 300
```

> **⚠️ 关键：必须加 `-L` 参数！** 很多机场域名经过 Cloudflare 会返回 301/302 重定向，不加 `-L` 只会拿到空的 HTML 页面。

#### Step 2：判断返回格式

| 返回内容 | 格式 | V2RayA 兼容性 |
|---------|------|:---:|
| 一串字母数字（Base64 编码） | V2Ray 通用格式 | ✅ |
| `mixed-port: 7890` 开头的 YAML | Clash 格式 | ❌ |
| `vmess://`、`vless://` 开头的链接 | 明文协议链接 | ✅ |

#### Step 3：解决格式不兼容

如果订阅返回的是 **Clash 格式（YAML）**，V2RayA 无法解析。需在订阅 URL 后追加参数，强制返回 Base64 格式：

```bash
# 原始地址
https://example.com/api/v1/client/subscribe?token=YOUR_TOKEN

# 加上 flag=v2rayn，强制返回 V2Ray 格式
https://example.com/api/v1/client/subscribe?token=YOUR_TOKEN&flag=v2rayn
```

验证是否生效：

```bash
curl -sL "你的订阅地址&flag=v2rayn" | head -c 300
# 如返回 Base64 字符串（如 dm1lc3M6Ly...），说明格式正确
```

将该地址填入 V2RayA 即可正常导入。

#### Step 4：常用 flag 参数一览

适用于 V2Board / Xboard 等常见机场面板：

| 参数 | 返回格式 | 适用客户端 |
|------|---------|-----------|
| `&flag=v2rayn` | Base64 | V2RayA / V2RayN |
| `&flag=clash` | Clash YAML | Clash / Mihomo |
| `&flag=shadowrocket` | Base64 | Shadowrocket |
| `&flag=quantumult` | 专有格式 | Quantumult X |

#### Step 5：备选方案 - 订阅转换

如果机场不支持 flag 参数，可借助在线订阅转换服务：

```bash
# 使用 subconverter API 转换
https://api.sublink.dev/sub?target=v2ray&url=你的原始订阅地址(需URL编码)
```

常用转换服务：
- [sublink.dev](https://api.sublink.dev)
- [sub-web（可自建）](https://github.com/CareyWang/sub-web)

### 问题总结

本例实际遇到了 **两个坑叠加**：

| # | 问题 | 表现 | 解决方案 |
|---|------|------|----------|
| 1 | HTTP 301 重定向 | curl 不加 `-L` 拿到空 HTML | 请求时加 `-L` 跟随跳转 |
| 2 | 默认返回 Clash 格式 | V2RayA 无法解析 YAML | 订阅 URL 追加 `&flag=v2rayn` |

---

## 九、其他常见问题

### Q1：镜像地址失效怎么办？

GitHub 加速镜像更新频繁，如果某个镜像无法使用，尝试：

| 镜像 | 地址前缀 |
|------|----------|
| ghfast | `https://ghfast.top/` |
| ghproxy.cc | `https://ghproxy.cc/` |
| gh-proxy | `https://gh-proxy.com/` |
| gitmirror | `https://hub.gitmirror.com/` |

用法：在 GitHub 原始链接前加上镜像前缀即可。

### Q2：`dpkg` 报错 "unexpected end of file"

说明 deb 文件下载不完整或损坏，删除后重新下载：

```bash
sudo rm -f /tmp/v2raya.deb
# 重新 wget 下载
```

### Q3：`xray` 找不到 geoip.dat / geosite.dat

确认文件存放路径正确：

```bash
ls /usr/local/share/xray/
# 应包含 geoip.dat 和 geosite.dat
```

### Q4：切换 Xray 核心

在 V2RayA Web 面板中：**设置 → 核心选择 → xray**，确保指向 `/usr/local/bin/xray`。

### Q5：代理已运行但 curl 不走代理

直接执行 `curl https://google.com` 不会自动走代理。必须通过以下方式之一：

- 显式指定代理：`curl -x http://127.0.0.1:20171 URL`
- 设置环境变量：`export http_proxy=http://127.0.0.1:20171`
- 在 V2RayA 设置中开启 **透明代理** 模式（全局生效）

---

## 十、卸载方式

如需完全卸载：

```bash
# 停止服务
sudo systemctl stop v2raya
sudo systemctl disable v2raya

# 卸载 V2RayA
sudo dpkg -r v2raya          # 保留配置
sudo dpkg --purge v2raya     # 彻底清除

# 删除 Xray
sudo rm -f /usr/local/bin/xray
sudo rm -rf /usr/local/share/xray

# 清理临时文件
sudo rm -f /tmp/v2raya.deb /tmp/xray.zip
sudo rm -rf /tmp/xray
```

---

## 十一、总结

完整安装流程概览：

```bash
# 1. 下载并安装 Xray 核心
sudo wget -O /tmp/xray.zip https://ghfast.top/https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip
sudo unzip -o /tmp/xray.zip -d /tmp/xray/
sudo install -Dm755 /tmp/xray/xray /usr/local/bin/xray
sudo mkdir -p /usr/local/share/xray
sudo cp /tmp/xray/geoip.dat /usr/local/share/xray/
sudo cp /tmp/xray/geosite.dat /usr/local/share/xray/

# 2. 下载并安装 V2RayA
sudo wget -O /tmp/v2raya.deb https://ghfast.top/https://github.com/v2rayA/v2rayA/releases/download/v2.2.6.3/installer_debian_x64_2.2.6.3.deb
sudo dpkg -i /tmp/v2raya.deb

# 3. 启动服务
sudo systemctl enable --now v2raya

# 4. 访问 http://127.0.0.1:2017 配置代理

# 5. 验证代理生效
curl -x http://127.0.0.1:20171 https://ipinfo.io
```

### 常用命令速查

```bash
# 服务管理
sudo systemctl start v2raya        # 启动
sudo systemctl stop v2raya         # 停止
sudo systemctl restart v2raya      # 重启
sudo systemctl status v2raya       # 查看状态

# 查看日志
sudo journalctl -u v2raya -f

# 排查订阅
curl -sL "订阅地址" | head -c 300
curl -sL "订阅地址" | base64 -d 2>/dev/null | head -c 500

# 验证代理
curl -x http://127.0.0.1:20171 https://ipinfo.io
curl -x http://127.0.0.1:20171 -o /dev/null -s -w "延迟: %{time_total}s\n" https://www.google.com
```

全程无需添加第三方 APT 源，操作简洁，适合快速部署。

---

## 参考链接

- [V2RayA 官方文档](https://v2raya.org/)
- [V2RayA GitHub](https://github.com/v2rayA/v2rayA)
- [Xray-core GitHub](https://github.com/XTLS/Xray-core)
- [V2RayA Debian 安装文档](https://v2raya.org/en/docs/prologue/installation/debian)
