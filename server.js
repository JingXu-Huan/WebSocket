/**
 * WebSocket Demo Server
 * 
 * 这个服务器同时提供：
 * 1. HTTP 静态文件服务（托管前端页面）
 * 2. REST API 端点（模拟 HTTP 轮询场景）
 * 3. WebSocket 服务（实时双向通信）
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// ─── 统计计数器 ──────────────────────────────────────────────────────────────
let httpRequestCount = 0;   // HTTP 轮询请求次数
let wsMessageCount = 0;     // WebSocket 消息次数
let activeConnections = 0;  // 当前活跃 WebSocket 连接数

// ─── HTTP 服务器 ─────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS 头，方便本地开发
  res.setHeader('Access-Control-Allow-Origin', '*');

  // API: HTTP 轮询端点 - 客户端需要反复请求才能获取最新数据
  if (req.url === '/api/time') {
    httpRequestCount++;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      timestamp: Date.now(),
      requestCount: httpRequestCount,
      message: '这是一次 HTTP 请求，需要你主动来问我才能获取数据。'
    }));
    return;
  }

  // API: 获取服务器统计信息
  if (req.url === '/api/stats') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      httpRequests: httpRequestCount,
      wsMessages: wsMessageCount,
      activeConnections
    }));
    return;
  }

  // 静态文件服务（防止路径遍历攻击）
  const publicDir = path.join(__dirname, 'public');
  // 解析 URL 路径（去掉查询参数），并去掉开头的 /
  const urlPathname = new URL(req.url, 'http://localhost').pathname;
  const relativePath = urlPathname === '/' ? 'index.html' : urlPathname.slice(1);
  // 规范化路径并解析到 publicDir 下
  const filePath = path.resolve(publicDir, path.normalize(relativePath));

  // 确保解析后的路径在 public 目录内，防止路径遍历攻击
  if (!filePath.startsWith(publicDir + path.sep) && filePath !== publicDir) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css',
    '.js':   'text/javascript',
    '.ico':  'image/x-icon'
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

// ─── WebSocket 服务器 ─────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server });

// 广播消息给所有已连接的客户端
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 服务器每秒主动推送时间（无需客户端请求）
setInterval(() => {
  if (wss.clients.size > 0) {
    broadcast({
      type: 'server-push',
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      timestamp: Date.now(),
      connections: activeConnections,
      message: '服务器主动推送！无需客户端请求。'
    });
  }
}, 1000);

wss.on('connection', (ws, req) => {
  activeConnections++;
  const clientId = `用户-${Math.floor(Math.random() * 9000) + 1000}`;

  console.log(`[WebSocket] 新连接: ${clientId}，当前连接数: ${activeConnections}`);

  // 向新连接的客户端发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId,
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    message: `欢迎！你的 ID 是 ${clientId}。WebSocket 连接已建立，服务器会主动推送消息给你。`
  }));

  // 通知所有客户端有新用户加入
  broadcast({
    type: 'user-joined',
    clientId,
    connections: activeConnections,
    message: `${clientId} 加入了聊天室，当前 ${activeConnections} 人在线。`
  });

  // 处理客户端发来的消息
  ws.on('message', (rawData) => {
    wsMessageCount++;
    let data;
    try {
      data = JSON.parse(rawData.toString());
    } catch {
      data = { text: rawData.toString() };
    }

    console.log(`[WebSocket] 收到消息 (${clientId}): ${data.text || rawData}`);

    // 广播给所有客户端（包括发送者）
    broadcast({
      type: 'chat',
      clientId,
      text: data.text || String(rawData),
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      totalMessages: wsMessageCount
    });
  });

  // 处理断开连接
  ws.on('close', () => {
    activeConnections--;
    console.log(`[WebSocket] 断开连接: ${clientId}，剩余连接数: ${activeConnections}`);
    broadcast({
      type: 'user-left',
      clientId,
      connections: activeConnections,
      message: `${clientId} 离开了聊天室，当前 ${activeConnections} 人在线。`
    });
  });

  ws.on('error', (err) => {
    console.error(`[WebSocket] 错误 (${clientId}):`, err.message);
  });
});

// ─── 启动服务器 ───────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('  WebSocket Demo 服务器已启动');
  console.log('  ─────────────────────────────────────────────');
  console.log(`  主页:       http://localhost:${PORT}`);
  console.log(`  聊天室:     http://localhost:${PORT}/chat.html`);
  console.log(`  对比演示:   http://localhost:${PORT}/comparison.html`);
  console.log('  ─────────────────────────────────────────────');
  console.log('');
});
