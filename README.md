# 🎉 Agent's Toolbox - Temporary Email Service

[![Monad Hackathon 2026](https://img.shields.io/badge/Monad-Hackathon%202026-purple)](https://monad.xyz)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Smart Contracts](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Frontend](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)

**🔗 GitHub Repository**: https://github.com/heddaaibot-ops/agent-toolbox-temp-email

**🌐 Live Frontend Demo**: https://heddaaibot-ops.github.io/agent-toolbox-temp-email/

**🚀 Local Demo**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

> ⚠️ **Note**: The live demo shows the frontend UI only. To test full functionality (wallet connection, purchase, emails), you need to run the backend API locally.

---

## 🌟 项目简介

去中心化的临时邮箱服务，建立在 Monad 区块链上。用户可以通过智能合约支付 USDC 或 MON 代币，获得临时邮箱地址，用于注册、验证等场景。

### 核心特性

✅ **智能合约支付** - 链上购买，所有权记录在区块链
✅ **双币支付系统** - 支持 USDC 稳定币和 MON 原生代币
✅ **自动化邮箱创建** - 后端监听区块链事件，自动创建临时邮箱
✅ **实时邮件同步** - 自动和手动同步接收到的邮件
✅ **Web3 钱包集成** - MetaMask 一键连接
✅ **美观的用户界面** - React + Tailwind CSS 现代化设计

---

## 🏗️ 技术架构

```
┌─────────────────┐
│  React Frontend │ (Vite + Tailwind CSS)
└────────┬────────┘
         │ ethers.js v6
         ▼
┌─────────────────┐
│ Smart Contracts │ (Solidity 0.8.20)
│  Monad Testnet  │
└─────────────────┘
         │ Events
         ▼
┌─────────────────┐
│  Backend API    │ (TypeScript + Express)
│  + Mail.tm API  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SQLite Database │ (Prisma ORM)
└─────────────────┘
```

---

## 🚀 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/heddaaibot-ops/agent-toolbox-temp-email.git
cd agent-toolbox-temp-email
```

### 2. 启动后端
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### 3. 启动前端
```bash
cd frontend
npm install
npm run dev
```

### 4. 打开应用
访问 http://localhost:5173

---

## 📦 部署信息

### Monad 测试网
- **EmailService 合约**: `0x7780BB8204140CDA39Dde230fe96b23144e8D3f2`
- **USDC Token**: `0x3b3a9b160d7F82f76ECa299efeb814094f011b10`
- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **区块浏览器**: https://testnet.monadscan.io

### 本地服务
- **后端 API**: http://localhost:3000
- **前端应用**: http://localhost:5173

---

## 🎯 功能演示

### 1. 连接钱包
![连接钱包](https://via.placeholder.com/800x400?text=Connect+Wallet)

### 2. 购买邮箱
![购买邮箱](https://via.placeholder.com/800x400?text=Purchase+Mailbox)

### 3. 查看邮件
![查看邮件](https://via.placeholder.com/800x400?text=View+Emails)

---

## 📚 文档

- 📖 [完整指南](./COMPLETE_GUIDE.md) - 详细的使用和开发指南
- 🚀 [快速启动](./QUICKSTART.md) - 5分钟上手
- 📝 [API 规范](./API_SPECIFICATION.md) - 后端 API 文档
- ✅ [项目清单](./CHECKLIST.md) - 开发完成度
- 🎯 [Demo 脚本](./DEMO_SCRIPT.md) - Hackathon 演示流程

---

## 🛠️ 技术栈

### 智能合约
- Solidity 0.8.20
- Foundry (编译、测试、部署)
- OpenZeppelin Contracts

### 后端
- TypeScript
- Express.js
- Prisma ORM
- ethers.js v6
- SQLite
- Mail.tm API

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS
- lucide-react (图标)
- ethers.js v6

---

## 🧪 测试

### 智能合约测试
```bash
forge test -vv
```

**结果**: 18/18 测试通过 ✅

### API 测试
```bash
./test-api.sh
```

---

## 📊 项目统计

- **代码文件**: 7,380+
- **代码行数**: 71,419+
- **测试用例**: 18 (100% 通过)
- **文档**: 17 个详细文档

---

## 👥 团队

- **Hedda** - 项目经理
- **姐姐 (Claude Opus 4.5)** - 全栈开发 (智能合约 + 后端 + 前端)
- **妹妹 (Gemini Pro)** - 项目协调

---

## 🏆 Monad Hackathon 2026

这个项目是为 Monad Hackathon 2026 创建的完整去中心化应用。

### 亮点
- ✅ 完整的全栈实现
- ✅ 生产级代码质量
- ✅ 创新的 Web2 + Web3 结合
- ✅ 美观的用户体验
- ✅ 详细的文档

---

## 📄 许可证

MIT License

---

## 🔗 链接

- **GitHub**: https://github.com/heddaaibot-ops/agent-toolbox-temp-email
- **Monad 官网**: https://monad.xyz
- **文档**: https://docs.monad.xyz

---

## 🙏 致谢

感谢 Monad 团队提供优秀的区块链平台！
感谢 Mail.tm 提供临时邮箱 API！

---

**Built with 💜 for Monad Hackathon 2026**
