# 🚀 快速启动指南

## 当前状态

✅ **后端运行中**: http://localhost:3000 (PID: 10867)
✅ **前端运行中**: http://localhost:5173
✅ **合约已部署**: Monad Testnet

---

## 立即开始使用

### 1. 打开应用
在浏览器访问: **http://localhost:5173**

### 2. 连接钱包
- 点击右上角 "Connect Wallet"
- MetaMask 会自动切换到 Monad 测试网

### 3. 购买邮箱
- 选择时长 (1-24小时)
- 选择支付方式 (MON 推荐)
- 点击购买，批准交易

### 4. 使用邮箱
- 复制临时邮箱地址
- 发送测试邮件
- 查看接收到的邮件

---

## 如何停止服务

```bash
# 停止后端
kill 10867

# 停止前端
# 在终端按 Ctrl+C
```

---

## 如何重启服务

### 启动后端
```bash
cd "/Users/heddaai/clawd/Agent's Toolbox Hackathon/backend"
npm run dev
```

### 启动前端
```bash
cd "/Users/heddaai/clawd/Agent's Toolbox Hackathon/frontend"
npm run dev
```

---

## 智能合约地址

**EmailService**: `0x7780BB8204140CDA39Dde230fe96b23144e8D3f2`
**USDC Token**: `0x3b3a9b160d7F82f76ECa299efeb814094f011b10`

查看合约: https://testnet.monadscan.io/address/0x7780BB8204140CDA39Dde230fe96b23144e8D3f2

---

## 测试 API

```bash
# 健康检查
curl http://localhost:3000/health

# 查看所有端点
curl http://localhost:3000/
```

---

## 需要帮助？

查看完整文档: `COMPLETE_GUIDE.md`
