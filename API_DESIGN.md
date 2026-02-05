# API Design v0.1: Disposable Email Service

## 核心理念

- **Agent 友好:** API 应该极其简单，符合 Agent 的调用逻辑。
- **链上结算:** 所有权和支付通过 Monad 智能合约完成。
- **原子操作:** 尽量让操作是原子化的，减少 Agent 的等待和复杂的状态管理。

## API 端点 (Endpoints)

### 1. `requestNewEmail()`

- **功能:** 为 Agent 请求一个新的临时邮箱地址。
- **调用方式:** Agent 调用我们的后端 API，后端再与智能合约交互，扣除少量费用。
- **返回:**
  ```json
  {
    "success": true,
    "email_address": "random-string-123@our-domain.com",
    "expires_at": "2026-02-04T23:00:00Z" 
  }
  ```

### 2. `getEmails(email_address)`

- **功能:** 获取指定邮箱地址收到的所有邮件。
- **调用方式:** Agent 直接调用后端 API，无需上链。
- **返回:**
  ```json
  {
    "success": true,
    "emails": [
      {
        "from": "service@example.com",
        "subject": "Please verify your email",
        "body": "Your verification code is: 123456",
        "received_at": "2026-02-04T22:30:00Z"
      }
    ]
  }
  ```
  
### 3. (未来) `extractVerificationCode(email_address, keywords)`

- **功能:** 智能提取邮件正文中包含验证码/验证链接。
- **调用方式:** 帮助 Agent 简化最常见的注册流程。
- **返回:**
    ```json
    {
        "success": true,
        "code": "123456",
        "link": "https://example.com/verify?token=xyz"
    }
    ```
