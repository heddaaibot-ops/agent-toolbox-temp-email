import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import mailboxRoutes from './routes/mailbox.routes';
import blockchainService from './services/blockchain.service';
import mailtmService from './services/mailtm.service';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS middleware (allow all origins for development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/mailbox', mailboxRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Agent Toolbox - Email Service API',
    version: '1.0.0',
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Agent Toolbox - Email Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      mailbox: {
        getMailbox: 'GET /api/mailbox/:mailboxId',
        getMessages: 'GET /api/mailbox/:mailboxId/messages',
        syncMessages: 'POST /api/mailbox/:mailboxId/sync',
        getStatus: 'GET /api/mailbox/:mailboxId/status',
        getBuyerMailboxes: 'GET /api/mailbox/buyer/:address',
      },
    },
    blockchain: {
      contract: process.env.CONTRACT_ADDRESS,
      rpc: process.env.MONAD_RPC_URL,
      chainId: process.env.CHAIN_ID,
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Cleanup expired mailboxes every hour
setInterval(async () => {
  try {
    console.log('\n🧹 Running cleanup task...');
    const count = await mailtmService.cleanupExpiredMailboxes();
    console.log(`✅ Cleanup complete: deactivated ${count} expired mailboxes\n`);
  } catch (error) {
    console.error('❌ Error in cleanup task:', error);
  }
}, 60 * 60 * 1000); // Every hour

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  blockchainService.stopListening();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  blockchainService.stopListening();
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Start blockchain event listener
    await blockchainService.startListening();

    // Optionally sync past events (uncomment if needed)
    // const currentBlock = await blockchainService.getCurrentBlock();
    // await blockchainService.syncPastEvents(currentBlock - 1000); // Last 1000 blocks

    // Start Express server
    app.listen(PORT, () => {
      console.log('\n🚀 ========================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🚀 http://localhost:${PORT}`);
      console.log('🚀 ========================================\n');
      console.log('📡 Blockchain listener active');
      console.log(`📧 Mail.tm integration ready`);
      console.log(`💾 Database connected`);
      console.log('\n✅ All systems operational!\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
