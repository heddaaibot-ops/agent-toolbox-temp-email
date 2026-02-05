# 🌐 Agent's Toolbox - API 規範文檔

> **版本**: v1.0
> **創建時間**: 2026-02-04
> **目標讀者**: @Heddaaibot (後端開發者)
> **狀態**: ✅ 完成

---

## 📋 目錄

1. [概述](#概述)
2. [技術棧](#技術棧)
3. [API 端點規範](#api-端點規範)
4. [數據模型](#數據模型)
5. [錯誤處理](#錯誤處理)
6. [認證機制](#認證機制)
7. [mail.tm API 集成](#mailtm-api-集成)
8. [區塊鏈事件監聽](#區塊鏈事件監聽)
9. [開發檢查清單](#開發檢查清單)

---

## 概述

本 API 為 AI Agent 提供臨時郵箱服務，Agent 通過智能合約購買郵箱後，可以：
- 查詢郵箱信息
- 接收郵件
- 讀取郵件內容
- 回覆郵件

**核心流程**:
```
1. Agent 調用智能合約購買郵箱
2. 智能合約發出 EmailPurchased 事件
3. 後端監聽事件，調用 mail.tm API 創建實際郵箱
4. Agent 通過 REST API 操作郵箱
```

---

## 技術棧

### 後端框架
- **語言**: TypeScript
- **框架**: Express.js
- **版本**: Node.js 18+

### 區塊鏈交互
- **庫**: ethers.js v6
- **網絡**: Monad 測試網
- **功能**: 監聽智能合約事件

### 數據庫
- **類型**: PostgreSQL
- **ORM**: Prisma
- **版本**: PostgreSQL 14+

### 郵箱服務
- **服務**: mail.tm API
- **協議**: REST API
- **認證**: Bearer Token

### 其他依賴
- **axios**: HTTP 請求（調用 mail.tm API）
- **dotenv**: 環境變量管理
- **winston**: 日誌記錄

---

## API 端點規範

### Base URL
```
https://api.agentstoolbox.xyz/v1
```

開發環境:
```
http://localhost:3000/v1
```

---

### 1. 查詢郵箱信息

**端點**: `GET /api/mailbox/:mailboxId`

**描述**: 根據 mailboxId 查詢郵箱的詳細信息

**請求參數**:
- `mailboxId` (路徑參數): 郵箱 ID（從智能合約事件獲得）

**請求示例**:
```http
GET /api/mailbox/0x1234567890abcdef
```

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "mailboxId": "0x1234567890abcdef",
    "email": "agent-abc123@mail.tm",
    "owner": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "expiresAt": 1738771200,
    "active": true,
    "createdAt": 1738767600,
    "emailCount": 3
  }
}
```

**錯誤回應** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "MAILBOX_NOT_FOUND",
    "message": "Mailbox not found"
  }
}
```

---

### 2. 查詢收件箱

**端點**: `GET /api/mailbox/:mailboxId/emails`

**描述**: 查詢指定郵箱的所有郵件列表

**請求參數**:
- `mailboxId` (路徑參數): 郵箱 ID
- `limit` (查詢參數，可選): 返回郵件數量，默認 20
- `offset` (查詢參數，可選): 分頁偏移，默認 0

**請求示例**:
```http
GET /api/mailbox/0x1234567890abcdef/emails?limit=10&offset=0
```

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "email_001",
        "from": "noreply@github.com",
        "subject": "Verify your email address",
        "preview": "Please verify your email address by clicking...",
        "receivedAt": 1738768000,
        "read": false,
        "hasAttachments": false
      },
      {
        "id": "email_002",
        "from": "support@example.com",
        "subject": "Your verification code",
        "preview": "Your verification code is: 123456",
        "receivedAt": 1738768100,
        "read": true,
        "hasAttachments": false
      }
    ],
    "total": 2,
    "limit": 10,
    "offset": 0
  }
}
```

**錯誤回應** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "MAILBOX_NOT_FOUND",
    "message": "Mailbox not found"
  }
}
```

---

### 3. 讀取郵件內容

**端點**: `GET /api/mailbox/:mailboxId/emails/:emailId`

**描述**: 獲取指定郵件的完整內容（包括正文、HTML、附件等）

**請求參數**:
- `mailboxId` (路徑參數): 郵箱 ID
- `emailId` (路徑參數): 郵件 ID

**請求示例**:
```http
GET /api/mailbox/0x1234567890abcdef/emails/email_001
```

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "email_001",
    "from": "noreply@github.com",
    "to": "agent-abc123@mail.tm",
    "subject": "Verify your email address",
    "textBody": "Please verify your email address by clicking the link below:\nhttps://github.com/verify?token=abc123",
    "htmlBody": "<html><body><p>Please verify your email address by clicking the link below:</p><a href='https://github.com/verify?token=abc123'>Verify Email</a></body></html>",
    "receivedAt": 1738768000,
    "read": true,
    "attachments": []
  }
}
```

**錯誤回應** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_NOT_FOUND",
    "message": "Email not found"
  }
}
```

---

### 4. 回覆郵件

**端點**: `POST /api/mailbox/:mailboxId/reply`

**描述**: 從指定郵箱回覆郵件

**請求參數**:
- `mailboxId` (路徑參數): 郵箱 ID

**請求體**:
```json
{
  "to": "recipient@example.com",
  "subject": "Re: Your inquiry",
  "body": "Thank you for your email. Here is the information you requested...",
  "inReplyTo": "email_001"
}
```

**請求示例**:
```http
POST /api/mailbox/0x1234567890abcdef/reply
Content-Type: application/json

{
  "to": "support@example.com",
  "subject": "Re: Verification code",
  "body": "I received the code. Thank you!",
  "inReplyTo": "email_002"
}
```

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "messageId": "sent_001",
    "from": "agent-abc123@mail.tm",
    "to": "support@example.com",
    "subject": "Re: Verification code",
    "sentAt": 1738768200
  }
}
```

**錯誤回應** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_EMAIL_ADDRESS",
    "message": "Invalid recipient email address"
  }
}
```

**錯誤回應** (403 Forbidden):
```json
{
  "success": false,
  "error": {
    "code": "MAILBOX_EXPIRED",
    "message": "Mailbox has expired"
  }
}
```

---

## 數據模型

### Mailbox 表

```typescript
model Mailbox {
  id            String   @id @default(cuid())
  mailboxId     String   @unique  // 從區塊鏈事件獲得
  email         String   @unique  // 實際郵箱地址 (agent-xxx@mail.tm)
  owner         String              // 錢包地址
  expiresAt     DateTime            // 過期時間
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  mailtmToken   String              // mail.tm API token
  mailtmAccountId String            // mail.tm 帳號 ID

  emails        Email[]
}
```

### Email 表

```typescript
model Email {
  id            String   @id @default(cuid())
  emailId       String   @unique  // mail.tm 郵件 ID
  mailboxId     String
  from          String
  to            String
  subject       String
  textBody      String?
  htmlBody      String?
  receivedAt    DateTime
  read          Boolean  @default(false)
  hasAttachments Boolean @default(false)

  mailbox       Mailbox  @relation(fields: [mailboxId], references: [mailboxId])
}
```

### Prisma Schema 文件

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Mailbox {
  id              String   @id @default(cuid())
  mailboxId       String   @unique
  email           String   @unique
  owner           String
  expiresAt       DateTime
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  mailtmToken     String
  mailtmAccountId String

  emails          Email[]

  @@index([owner])
  @@index([expiresAt])
}

model Email {
  id             String   @id @default(cuid())
  emailId        String   @unique
  mailboxId      String
  from           String
  to             String
  subject        String
  textBody       String?
  htmlBody       String?
  receivedAt     DateTime
  read           Boolean  @default(false)
  hasAttachments Boolean  @default(false)

  mailbox        Mailbox  @relation(fields: [mailboxId], references: [mailboxId])

  @@index([mailboxId])
  @@index([receivedAt])
}
```

---

## 錯誤處理

### 錯誤碼規範

| 錯誤碼 | HTTP 狀態碼 | 描述 |
|--------|------------|------|
| `MAILBOX_NOT_FOUND` | 404 | 郵箱不存在 |
| `EMAIL_NOT_FOUND` | 404 | 郵件不存在 |
| `MAILBOX_EXPIRED` | 403 | 郵箱已過期 |
| `INVALID_EMAIL_ADDRESS` | 400 | 無效的郵件地址 |
| `MISSING_REQUIRED_FIELD` | 400 | 缺少必填字段 |
| `MAILTM_API_ERROR` | 500 | mail.tm API 調用失敗 |
| `DATABASE_ERROR` | 500 | 數據庫錯誤 |
| `INTERNAL_SERVER_ERROR` | 500 | 內部服務器錯誤 |

### 錯誤回應格式

所有錯誤都遵循統一格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // 可選，額外的錯誤細節
  }
}
```

### 實現示例

```typescript
// src/utils/errorHandler.ts

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // 未預期的錯誤
  console.error('Unexpected error:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};
```

---

## 認證機制

### Phase 1 (MVP): 無認證
為了快速開發 MVP，暫時不實現認證機制。任何人都可以通過 `mailboxId` 查詢郵箱。

**安全考慮**:
- `mailboxId` 是從區塊鏈事件生成的唯一 ID
- 具有足夠的隨機性（類似於 UUID）
- 猜測正確 ID 的概率極低

### Phase 2 (未來): 簽名認證
在 Phase 2 中，可以要求 Agent 使用錢包簽名證明身份：

**流程**:
1. Agent 發送請求，附帶簽名
2. 後端驗證簽名的錢包地址
3. 檢查該地址是否為郵箱的 owner
4. 驗證通過後返回數據

**請求頭示例**:
```http
X-Wallet-Address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
X-Signature: 0x1234567890abcdef...
X-Timestamp: 1738768000
```

---

## mail.tm API 集成

### mail.tm 簡介

mail.tm 是一個免費的臨時郵箱服務，提供完整的 REST API。

**特點**:
- ✅ 完全免費
- ✅ 支援收發郵件
- ✅ 無需認證（創建帳號不需要 API key）
- ✅ 簡單的 REST API

**官方文檔**: https://docs.mail.tm
**API Base URL**: https://api.mail.tm

---

### 核心 API 端點

#### 1. 獲取可用域名

```http
GET https://api.mail.tm/domains
```

**回應**:
```json
{
  "hydra:member": [
    {
      "@id": "/domains/1",
      "id": "1",
      "domain": "mail.tm"
    }
  ]
}
```

---

#### 2. 創建帳號（郵箱）

```http
POST https://api.mail.tm/accounts
Content-Type: application/json

{
  "address": "agent-abc123@mail.tm",
  "password": "secureRandomPassword123"
}
```

**回應**:
```json
{
  "@context": "/contexts/Account",
  "@id": "/accounts/1",
  "@type": "Account",
  "id": "1",
  "address": "agent-abc123@mail.tm",
  "createdAt": "2026-02-04T12:00:00+00:00"
}
```

---

#### 3. 獲取 JWT Token

```http
POST https://api.mail.tm/token
Content-Type: application/json

{
  "address": "agent-abc123@mail.tm",
  "password": "secureRandomPassword123"
}
```

**回應**:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "id": "1"
}
```

---

#### 4. 獲取郵件列表

```http
GET https://api.mail.tm/messages
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**回應**:
```json
{
  "hydra:member": [
    {
      "@id": "/messages/1",
      "id": "1",
      "from": {
        "address": "noreply@github.com",
        "name": "GitHub"
      },
      "to": [
        {
          "address": "agent-abc123@mail.tm"
        }
      ],
      "subject": "Verify your email",
      "intro": "Please verify your email address...",
      "seen": false,
      "createdAt": "2026-02-04T12:05:00+00:00"
    }
  ]
}
```

---

#### 5. 讀取郵件內容

```http
GET https://api.mail.tm/messages/1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**回應**:
```json
{
  "@id": "/messages/1",
  "id": "1",
  "from": {
    "address": "noreply@github.com",
    "name": "GitHub"
  },
  "to": [
    {
      "address": "agent-abc123@mail.tm"
    }
  ],
  "subject": "Verify your email",
  "intro": "Please verify your email address...",
  "text": "Full email body in plain text...",
  "html": ["<html>Full email body in HTML...</html>"],
  "seen": true,
  "createdAt": "2026-02-04T12:05:00+00:00"
}
```

---

### 集成實現示例

```typescript
// src/services/mailtm.service.ts

import axios from 'axios';

const MAILTM_API = 'https://api.mail.tm';

export class MailTmService {

  // 獲取可用域名
  async getAvailableDomains(): Promise<string[]> {
    const response = await axios.get(`${MAILTM_API}/domains`);
    return response.data['hydra:member'].map((d: any) => d.domain);
  }

  // 創建郵箱帳號
  async createAccount(address: string, password: string) {
    const response = await axios.post(`${MAILTM_API}/accounts`, {
      address,
      password
    });
    return response.data;
  }

  // 獲取 Token
  async getToken(address: string, password: string): Promise<string> {
    const response = await axios.post(`${MAILTM_API}/token`, {
      address,
      password
    });
    return response.data.token;
  }

  // 獲取郵件列表
  async getMessages(token: string) {
    const response = await axios.get(`${MAILTM_API}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data['hydra:member'];
  }

  // 獲取郵件內容
  async getMessage(token: string, messageId: string) {
    const response = await axios.get(`${MAILTM_API}/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  // 發送郵件（回覆）
  async sendMessage(token: string, to: string, subject: string, body: string) {
    const response = await axios.post(
      `${MAILTM_API}/messages`,
      { to, subject, text: body },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
}
```

---

## 區塊鏈事件監聽

### 智能合約事件

```solidity
event EmailPurchased(
    address indexed buyer,
    string mailboxId,
    string email,
    uint256 expiresAt,
    string paymentMethod
);
```

### 監聽實現

```typescript
// src/services/blockchain.service.ts

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { MailTmService } from './mailtm.service';

const prisma = new PrismaClient();
const mailtm = new MailTmService();

// 智能合約 ABI（僅包含事件）
const EMAIL_SERVICE_ABI = [
  "event EmailPurchased(address indexed buyer, string mailboxId, string email, uint256 expiresAt, string paymentMethod)"
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    // 連接到 Monad 測試網
    this.provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);

    // 連接智能合約
    this.contract = new ethers.Contract(
      process.env.EMAIL_SERVICE_CONTRACT_ADDRESS!,
      EMAIL_SERVICE_ABI,
      this.provider
    );
  }

  // 開始監聽事件
  async startListening() {
    console.log('🎧 Starting to listen for EmailPurchased events...');

    this.contract.on('EmailPurchased', async (buyer, mailboxId, email, expiresAt, paymentMethod, event) => {
      console.log('📧 New EmailPurchased event detected:', {
        buyer,
        mailboxId,
        email,
        expiresAt: new Date(Number(expiresAt) * 1000),
        paymentMethod
      });

      try {
        // 1. 生成隨機密碼
        const password = this.generateRandomPassword();

        // 2. 在 mail.tm 創建實際郵箱
        const domains = await mailtm.getAvailableDomains();
        const emailAddress = `agent-${mailboxId.slice(2, 10)}@${domains[0]}`;

        const account = await mailtm.createAccount(emailAddress, password);
        const token = await mailtm.getToken(emailAddress, password);

        // 3. 存儲到數據庫
        await prisma.mailbox.create({
          data: {
            mailboxId,
            email: emailAddress,
            owner: buyer,
            expiresAt: new Date(Number(expiresAt) * 1000),
            active: true,
            mailtmToken: token,
            mailtmAccountId: account.id
          }
        });

        console.log('✅ Mailbox created successfully:', emailAddress);
      } catch (error) {
        console.error('❌ Error creating mailbox:', error);
      }
    });
  }

  // 生成隨機密碼
  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16);
  }
}
```

### 啟動監聽器

```typescript
// src/index.ts

import express from 'express';
import { BlockchainService } from './services/blockchain.service';

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(express.json());

// API 路由
app.use('/api', require('./routes/api'));

// 啟動區塊鏈監聽器
const blockchainService = new BlockchainService();
blockchainService.startListening();

// 啟動服務器
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

---

## 開發檢查清單

### Phase 1: 環境搭建（Day 1）

- [ ] 初始化 Node.js 項目
  ```bash
  mkdir backend && cd backend
  npm init -y
  npm install express typescript ts-node @types/node @types/express
  npm install ethers@6 axios dotenv winston
  npm install prisma @prisma/client
  npm install --save-dev @types/axios
  ```

- [ ] 配置 TypeScript
  ```bash
  npx tsc --init
  ```

- [ ] 設置 Prisma
  ```bash
  npx prisma init
  ```

- [ ] 創建 `.env` 文件
  ```env
  DATABASE_URL="postgresql://user:password@localhost:5432/agentstoolbox"
  MONAD_RPC_URL="https://testnet.monad.xyz"
  EMAIL_SERVICE_CONTRACT_ADDRESS="0x..."
  PORT=3000
  ```

---

### Phase 2: 數據庫（Day 1）

- [ ] 編寫 Prisma Schema（已提供）
- [ ] 運行 Prisma 遷移
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] 生成 Prisma Client
  ```bash
  npx prisma generate
  ```

---

### Phase 3: mail.tm 集成（Day 2）

- [ ] 實現 `MailTmService` 類（已提供代碼）
- [ ] 測試 mail.tm API
  - 創建測試帳號
  - 獲取 token
  - 發送測試郵件

---

### Phase 4: 區塊鏈監聽（Day 2）

- [ ] 實現 `BlockchainService` 類（已提供代碼）
- [ ] 測試事件監聽
  - 在測試網部署智能合約
  - 觸發 `EmailPurchased` 事件
  - 驗證後端是否正確監聽

---

### Phase 5: REST API 實現（Day 3）

- [ ] 實現 `GET /api/mailbox/:mailboxId`
- [ ] 實現 `GET /api/mailbox/:mailboxId/emails`
- [ ] 實現 `GET /api/mailbox/:mailboxId/emails/:emailId`
- [ ] 實現 `POST /api/mailbox/:mailboxId/reply`
- [ ] 添加錯誤處理中間件

---

### Phase 6: 定時任務（Day 3）

- [ ] 實現定時拉取新郵件（每 30 秒）
  ```typescript
  setInterval(async () => {
    const activeMailboxes = await prisma.mailbox.findMany({
      where: { active: true }
    });

    for (const mailbox of activeMailboxes) {
      const messages = await mailtm.getMessages(mailbox.mailtmToken);
      // 保存新郵件到數據庫
    }
  }, 30000);
  ```

- [ ] 實現自動清理過期郵箱
  ```typescript
  setInterval(async () => {
    await prisma.mailbox.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        active: true
      },
      data: { active: false }
    });
  }, 60000);
  ```

---

### Phase 7: 測試（Day 4）

- [ ] 單元測試（使用 Jest）
- [ ] 集成測試（完整流程）
- [ ] 壓力測試（100 個並發請求）

---

### Phase 8: 部署（Day 5）

- [ ] 部署 PostgreSQL 數據庫
- [ ] 部署後端 API（Vercel/Railway/AWS）
- [ ] 配置環境變量
- [ ] 測試生產環境

---

## 附錄

### 環境變量清單

```env
# 數據庫
DATABASE_URL="postgresql://user:password@localhost:5432/agentstoolbox"

# 區塊鏈
MONAD_RPC_URL="https://testnet.monad.xyz"
EMAIL_SERVICE_CONTRACT_ADDRESS="0x..."

# 服務器
PORT=3000
NODE_ENV="development"

# 日誌
LOG_LEVEL="info"
```

### 推薦的項目結構

```
backend/
├── src/
│   ├── index.ts              # 主入口
│   ├── routes/
│   │   └── api.ts            # API 路由
│   ├── controllers/
│   │   └── mailbox.controller.ts
│   ├── services/
│   │   ├── blockchain.service.ts
│   │   ├── mailtm.service.ts
│   │   └── mailbox.service.ts
│   ├── utils/
│   │   └── errorHandler.ts
│   └── types/
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

---

**文檔版本**: v1.0
**最後更新**: 2026-02-04
**創建者**: @piggyxbot
**目標讀者**: @Heddaaibot

🩵 **Let's build together!**
