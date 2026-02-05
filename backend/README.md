# Agent's Toolbox - Email Service Backend

Backend API for the temporary email service powered by blockchain payments.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The `.env` file is already configured with testnet settings:

```env
CONTRACT_ADDRESS=0x7780BB8204140CDA39Dde230fe96b23144e8D3f2
USDC_ADDRESS=0x3b3a9b160d7F82f76ECa299efeb814094f011b10
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=10143
DATABASE_URL=file:./dev.db
PORT=3000
```

### 3. Setup Database

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on http://localhost:3000

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Get Mailbox Details
```
GET /api/mailbox/:mailboxId
```

### Get Mailbox Messages
```
GET /api/mailbox/:mailboxId/messages
GET /api/mailbox/:mailboxId/messages?sync=true  # Force sync from mail.tm
```

### Sync Messages Manually
```
POST /api/mailbox/:mailboxId/sync
```

### Check Mailbox Status
```
GET /api/mailbox/:mailboxId/status
```

### Get Buyer's Mailboxes
```
GET /api/mailbox/buyer/:address
```

## 🏗️ Architecture

### Services

- **blockchain.service.ts**: Listens to smart contract events, creates mailboxes
- **mailtm.service.ts**: Integrates with mail.tm API for temporary emails

### Routes

- **mailbox.routes.ts**: REST API endpoints for mailbox operations

### Database

- **Prisma ORM** with SQLite
- Models: Mailbox, Message, BlockchainEvent

## 🔄 How It Works

1. **User purchases mailbox** on blockchain (via smart contract)
2. **Smart contract emits** `EmailPurchased` event
3. **Backend listens** to event and:
   - Creates temporary email via mail.tm
   - Saves mailboxId → email mapping to database
4. **User queries API** with mailboxId to get email address
5. **User receives emails** at temporary address
6. **Backend syncs messages** from mail.tm periodically

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

### Test Mailbox Query (after a purchase)
```bash
curl http://localhost:3000/api/mailbox/YOUR_MAILBOX_ID
```

## 🛠️ Development

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

### Database Commands
```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npx prisma studio        # Open database GUI
```

## 📊 Project Structure

```
backend/
├── src/
│   ├── index.ts              # Main entry point
│   ├── routes/
│   │   └── mailbox.routes.ts # API routes
│   ├── services/
│   │   ├── blockchain.service.ts  # Blockchain event listener
│   │   └── mailtm.service.ts      # Mail.tm integration
│   ├── types/                # TypeScript types
│   └── utils/                # Utility functions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── .env                      # Environment variables
├── tsconfig.json             # TypeScript config
├── nodemon.json              # Nodemon config
└── package.json              # Dependencies & scripts
```

## 🔧 Technologies

- **Express.js**: Web framework
- **TypeScript**: Type safety
- **Prisma**: Database ORM
- **ethers.js**: Blockchain interaction
- **axios**: HTTP client for mail.tm
- **winston**: Logging

## 👥 Contributors

- 姐姐 @piggyxbot (Claude Opus) - Blockchain & Backend
- 妹妹 @Heddaaibot (Gemini Pro) - API Integration

## 📝 License

MIT
