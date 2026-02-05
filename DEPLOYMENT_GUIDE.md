# 📦 EmailService 部署指南

> **Agent's Toolbox Hackathon** - 智能合約部署完整指南

---

## 📋 目錄

1. [環境準備](#環境準備)
2. [本地測試](#本地測試)
3. [部署到 Monad 測試網](#部署到-monad-測試網)
4. [驗證合約](#驗證合約)
5. [與後端集成](#與後端集成)
6. [常見問題](#常見問題)

---

## 🛠️ 環境準備

### 1. 安裝 Foundry

```bash
# 安裝 Foundry（Forge、Cast、Anvil）
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. 克隆項目並安裝依賴

```bash
cd "Agent's Toolbox Hackathon"

# 安裝 OpenZeppelin 合約依賴
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### 3. 配置環境變量

```bash
# 複製環境變量模板
cp .env.example .env

# 編輯 .env 文件，填入你的私鑰
nano .env
```

**`.env` 文件示例：**

```env
PRIVATE_KEY=0xYourPrivateKeyHere
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
USDC_ADDRESS=  # 留空會自動部署 Mock USDC
```

⚠️ **安全提醒**：
- 不要把 `.env` 文件提交到 Git
- 使用測試網專用的錢包私鑰
- 確保 `.gitignore` 包含 `.env`

---

## 🧪 本地測試

### 1. 運行所有測試

```bash
forge test
```

### 2. 運行特定測試文件

```bash
forge test --match-path test/EmailService.t.sol
```

### 3. 顯示詳細日誌

```bash
forge test -vvv
```

### 4. 測試覆蓋率

```bash
forge coverage
```

### 5. Gas 報告

```bash
forge test --gas-report
```

---

## 🚀 部署到 Monad 測試網

### 方法 1：使用環境變量（推薦）

```bash
# 加載環境變量
source .env

# 模擬部署（不實際上鏈）
forge script script/Deploy.s.sol --rpc-url $MONAD_RPC_URL

# 實際部署
forge script script/Deploy.s.sol \
  --rpc-url $MONAD_RPC_URL \
  --broadcast \
  --verify
```

### 方法 2：直接指定參數

```bash
forge script script/Deploy.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key YOUR_PRIVATE_KEY \
  --broadcast
```

### 方法 3：使用 Ledger 硬件錢包

```bash
forge script script/Deploy.s.sol \
  --rpc-url $MONAD_RPC_URL \
  --ledger \
  --sender YOUR_ADDRESS \
  --broadcast
```

---

## ✅ 部署成功後

部署成功後，終端會顯示：

```
========================================
EmailService Deployed Successfully!
========================================
Contract Address:       0xABC123...
USDC Address:           0xDEF456...
Price per Hour (USDC):  1000 (0.001 USDC)
Price per Hour (MON):   1000000000000000 (0.001 MON)
Owner:                  0xYourAddress...
========================================
```

同時會生成 `deployment.json` 文件：

```json
{
  "emailService": "0xABC123...",
  "usdc": "0xDEF456...",
  "network": "monad-testnet",
  "deployedAt": "1707134400"
}
```

---

## 🔍 驗證合約

### 在 Monad 區塊鏈瀏覽器上驗證

```bash
forge verify-contract \
  --chain-id MONAD_CHAIN_ID \
  --num-of-optimizations 200 \
  --constructor-args $(cast abi-encode "constructor(address,uint256,uint256)" \
    $USDC_ADDRESS 1000 1000000000000000) \
  CONTRACT_ADDRESS \
  src/EmailService.sol:EmailService \
  --etherscan-api-key YOUR_API_KEY
```

---

## 🔗 與後端集成

### 1. 更新後端環境變量

在後端項目的 `.env` 文件中添加：

```env
# 從 deployment.json 複製這些值
CONTRACT_ADDRESS=0xABC123...
USDC_ADDRESS=0xDEF456...
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

### 2. 複製 ABI 文件

```bash
# 生成 ABI
forge build

# ABI 文件位於：
# out/EmailService.sol/EmailService.json
```

複製 ABI 到後端項目：

```bash
cp out/EmailService.sol/EmailService.json ../backend/src/abi/
```

### 3. 測試合約交互

使用 `cast` 工具測試合約：

```bash
# 查詢價格
cast call $CONTRACT_ADDRESS "pricePerHourMON()" --rpc-url $MONAD_RPC_URL

# 購買郵箱（使用 MON）
cast send $CONTRACT_ADDRESS \
  "purchaseMailbox(uint256,address)" \
  1 \
  0x0000000000000000000000000000000000000000 \
  --value 0.001ether \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY

# 查詢我的郵箱
cast call $CONTRACT_ADDRESS "getMyMailboxes()" \
  --from YOUR_ADDRESS \
  --rpc-url $MONAD_RPC_URL
```

---

## 🧰 合約管理

### 更新價格（僅 Owner）

```bash
# 更新為 0.002 USDC 和 0.002 MON
cast send $CONTRACT_ADDRESS \
  "updatePrice(uint256,uint256)" \
  2000 \
  2000000000000000 \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 提取 USDC（僅 Owner）

```bash
cast send $CONTRACT_ADDRESS \
  "withdrawUSDC(address)" \
  YOUR_ADDRESS \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 提取 MON（僅 Owner）

```bash
cast send $CONTRACT_ADDRESS \
  "withdrawMON(address)" \
  YOUR_ADDRESS \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## ❓ 常見問題

### Q1: 如何獲取 Monad 測試網代幣？

訪問 Monad 測試網水龍頭：
- 官方水龍頭：https://faucet.monad.xyz

### Q2: 部署時出現 "insufficient funds" 錯誤？

確保你的錢包有足夠的 MON 代幣支付 Gas 費用。

### Q3: 如何切換網絡？

修改 `.env` 中的 `MONAD_RPC_URL`：

```env
# 測試網
MONAD_RPC_URL=https://testnet-rpc.monad.xyz

# 主網（未來）
MONAD_RPC_URL=https://rpc.monad.xyz
```

### Q4: 忘記保存合約地址怎麼辦？

查看 `deployment.json` 文件，或在區塊鏈瀏覽器搜索你的部署交易。

### Q5: 如何重新部署合約？

直接再次運行部署腳本即可，每次部署都會生成新的合約地址。

---

## 📚 相關文檔

- [Foundry Book](https://book.getfoundry.sh/)
- [Monad 開發者文檔](https://docs.monad.xyz)
- [OpenZeppelin 合約文檔](https://docs.openzeppelin.com/contracts/)

---

## 🤝 需要幫助？

- 姐姐（智能合約開發）：@piggyxbot
- 妹妹（後端開發）：@Heddaaibot

---

**部署愉快！🚀**
