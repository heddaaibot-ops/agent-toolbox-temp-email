import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import mailtmService from './mailtm.service';

const prisma = new PrismaClient();

// EmailService contract ABI - only the events and functions we need
const EMAIL_SERVICE_ABI = [
  'event EmailPurchased(address indexed buyer, string mailboxId, string email, uint256 expiresAt, string paymentMethod)',
  'function getMailbox(string mailboxId) view returns (address owner, string mailboxId, uint256 createdAt, uint256 expiresAt, uint256 duration, string paymentMethod, bool active)',
  'function isMailboxActive(string mailboxId) view returns (bool)',
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private contractAddress: string;
  private isListening = false;

  constructor() {
    const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
    this.contractAddress = process.env.CONTRACT_ADDRESS || '';

    if (!this.contractAddress) {
      throw new Error('CONTRACT_ADDRESS not set in environment variables');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new ethers.Contract(
      this.contractAddress,
      EMAIL_SERVICE_ABI,
      this.provider
    );

    console.log(`📡 Blockchain service initialized`);
    console.log(`   Contract: ${this.contractAddress}`);
    console.log(`   RPC: ${rpcUrl}`);
  }

  /**
   * Start listening to EmailPurchased events
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️  Already listening to blockchain events');
      return;
    }

    try {
      // Listen to EmailPurchased events
      this.contract.on('EmailPurchased', async (buyer, mailboxId, email, expiresAt, paymentMethod, event) => {
        console.log('\n🎉 New EmailPurchased event detected!');
        console.log(`   Buyer: ${buyer}`);
        console.log(`   MailboxId: ${mailboxId}`);
        console.log(`   Payment: ${paymentMethod}`);
        console.log(`   Transaction: ${event.log.transactionHash}`);

        try {
          await this.handleEmailPurchased({
            buyer,
            mailboxId,
            expiresAt: Number(expiresAt),
            paymentMethod,
            transactionHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
          });
        } catch (error) {
          console.error('❌ Error handling EmailPurchased event:', error);
        }
      });

      this.isListening = true;
      console.log('✅ Started listening to blockchain events');
    } catch (error) {
      console.error('❌ Error starting blockchain listener:', error);
      throw error;
    }
  }

  /**
   * Stop listening to events
   */
  stopListening(): void {
    this.contract.removeAllListeners('EmailPurchased');
    this.isListening = false;
    console.log('🛑 Stopped listening to blockchain events');
  }

  /**
   * Handle EmailPurchased event
   */
  private async handleEmailPurchased(eventData: {
    buyer: string;
    mailboxId: string;
    expiresAt: number;
    paymentMethod: string;
    transactionHash: string;
    blockNumber: number;
  }): Promise<void> {
    const { buyer, mailboxId, expiresAt, paymentMethod, transactionHash, blockNumber } = eventData;

    try {
      // Check if event already processed
      const existingEvent = await prisma.blockchainEvent.findUnique({
        where: { transactionHash },
      });

      if (existingEvent && existingEvent.processed) {
        console.log(`⏭️  Event already processed: ${transactionHash}`);
        return;
      }

      // Save event to database
      await prisma.blockchainEvent.upsert({
        where: { transactionHash },
        update: {
          processed: false,
        },
        create: {
          eventType: 'EmailPurchased',
          transactionHash,
          blockNumber,
          mailboxId,
          buyer,
          expiresAt: new Date(expiresAt * 1000),
          paymentMethod,
          processed: false,
        },
      });

      console.log(`💾 Saved blockchain event: ${transactionHash}`);

      // Create mail.tm account
      const account = await mailtmService.createAccount();

      // Get duration from blockchain
      const onChainData = await this.contract.getMailbox(mailboxId);
      const duration = Number(onChainData[4]); // duration is at index 4

      // Save mailbox to database
      await prisma.mailbox.create({
        data: {
          mailboxId,
          email: account.email,
          password: account.password,
          buyer,
          expiresAt: new Date(expiresAt * 1000),
          duration,
          paymentMethod,
          active: true,
        },
      });

      console.log(`✅ Created mailbox in database: ${mailboxId}`);
      console.log(`   Email: ${account.email}`);

      // Mark event as processed
      await prisma.blockchainEvent.update({
        where: { transactionHash },
        data: { processed: true },
      });

      console.log(`✅ Event processing complete!`);
    } catch (error) {
      console.error('❌ Error in handleEmailPurchased:', error);
      throw error;
    }
  }

  /**
   * Query mailbox from blockchain
   */
  async getMailboxFromChain(mailboxId: string): Promise<any> {
    try {
      const data = await this.contract.getMailbox(mailboxId);
      return {
        owner: data[0],
        mailboxId: data[1],
        createdAt: new Date(Number(data[2]) * 1000),
        expiresAt: new Date(Number(data[3]) * 1000),
        duration: Number(data[4]),
        paymentMethod: data[5],
        active: data[6],
      };
    } catch (error) {
      console.error('Error querying mailbox from chain:', error);
      throw error;
    }
  }

  /**
   * Check if mailbox is active on chain
   */
  async isMailboxActive(mailboxId: string): Promise<boolean> {
    try {
      return await this.contract.isMailboxActive(mailboxId);
    } catch (error) {
      console.error('Error checking mailbox status:', error);
      return false;
    }
  }

  /**
   * Sync past events (for initialization)
   */
  async syncPastEvents(fromBlock: number = 0): Promise<number> {
    try {
      console.log(`🔄 Syncing past events from block ${fromBlock}...`);

      const filter = this.contract.filters.EmailPurchased();
      const events = await this.contract.queryFilter(filter, fromBlock);

      console.log(`📦 Found ${events.length} past events`);

      let processed = 0;
      for (const event of events) {
        try {
          // Check if event is EventLog (has args property)
          if (!('args' in event)) {
            continue;
          }
          const args = event.args as any;
          await this.handleEmailPurchased({
            buyer: args.buyer,
            mailboxId: args.mailboxId,
            expiresAt: Number(args.expiresAt),
            paymentMethod: args.paymentMethod,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });
          processed++;
        } catch (error) {
          console.error(`Error processing event at block ${event.blockNumber}:`, error);
        }
      }

      console.log(`✅ Synced ${processed}/${events.length} past events`);
      return processed;
    } catch (error) {
      console.error('Error syncing past events:', error);
      throw error;
    }
  }

  /**
   * Get current block number
   */
  async getCurrentBlock(): Promise<number> {
    return await this.provider.getBlockNumber();
  }
}

export default new BlockchainService();
