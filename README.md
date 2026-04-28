# ⚡ WebSocket Demo

一个直观的 WebSocket 演示项目，通过可运行的实例帮助你理解 WebSocket 的工作原理，以及它与 HTTP 轮询等其他协议的区别。

---

## 🚀 快速启动

**前提条件：** 安装了 [Node.js](https://nodejs.org/)（v14+）

```bash
# 1. 安装依赖
npm install

# 2. 启动服务器
npm start

# 3. 打开浏览器访问
# 首页（原理介绍）: http://localhost:3000
# 聊天室 Demo:      http://localhost:3000/chat.html
# 协议对比 Demo:    http://localhost:3000/comparison.html
```

---

## 📖 项目结构

```
WebSocket/
├── server.js              # Node.js 服务器（HTTP + WebSocket）
├── package.json
└── public/
    ├── index.html         # 首页：WebSocket 原理介绍 + 协议对比表
    ├── chat.html          # 聊天室：体验实时广播
    ├── comparison.html    # 对比 Demo：WebSocket vs HTTP 轮询
    └── styles.css         # 共享样式
```

---

## 🔌 WebSocket 是什么？

WebSocket 是一种在**单个 TCP 连接**上进行**全双工**通信的网络协议（RFC 6455）。

它通过 HTTP 升级握手建立连接，之后双方可以随时互相发送数据，不再需要 HTTP 的"请求-响应"模式。

### 握手过程

```
客户端发送:
  GET /chat HTTP/1.1
  Upgrade: websocket
  Connection: Upgrade
  Sec-WebSocket-Key: dGhlIHNhbXBsZQ==

服务器响应:
  HTTP/1.1 101 Switching Protocols
  Upgrade: websocket
  Connection: Upgrade

连接建立！双方现在可以随时互相发送数据。
```

---

## 📊 WebSocket vs 其他协议

| 特性 | WebSocket | HTTP 短轮询 | HTTP 长轮询 | SSE |
|------|-----------|------------|------------|-----|
| **通信方向** | 全双工 ↔ | 单向（客户端→服务端）| 单向 | 单向（服务端→客户端）|
| **连接方式** | 持久连接 | 每次新建 | 保持等待 | 持久连接 |
| **服务器推送** | ✅ 支持 | ❌ 不支持 | ⚠️ 间接支持 | ✅ 支持 |
| **消息延迟** | 极低（毫秒级）| 高（轮询间隔）| 中等 | 低 |
| **带宽开销** | 低（帧头 2-10 字节）| 高（HTTP 头 400+ 字节）| 中等 | 中等 |
| **典型场景** | 聊天、游戏、实时协作 | 偶发性数据查询 | 消息通知 | 新闻推送、AI 输出 |

### 关键区别

- **HTTP 轮询**：客户端每隔一段时间发出请求问"有没有新数据？"，每次都携带完整 HTTP 头（约 400 字节），浪费带宽，且有延迟盲区。
- **WebSocket**：连接建立后，服务器可以随时主动推送数据，帧头仅 2~10 字节，延迟极低，效率极高。

---

## 💡 典型使用场景

- 💬 **即时聊天**（微信、Slack、Discord）
- 🎮 **多人游戏**（实时同步位置、状态）
- 📈 **实时行情**（股票、加密货币价格）
- 📝 **协同编辑**（Google Docs、Figma）
- 🔔 **实时通知**（推送提醒、告警）
- 🤖 **AI 流式回复**（ChatGPT 逐字输出）

---

## 🛠️ 技术栈

- **后端**：Node.js 原生 `http` 模块 + [`ws`](https://github.com/websockets/ws) 库
- **前端**：原生 HTML / CSS / JavaScript（无框架依赖）
- **WebSocket 客户端**：浏览器内置 `WebSocket` API
