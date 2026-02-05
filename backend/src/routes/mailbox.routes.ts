import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import mailtmService from '../services/mailtm.service';
import blockchainService from '../services/blockchain.service';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/mailbox/:mailboxId
 * Get mailbox details by mailboxId
 */
router.get('/:mailboxId', async (req: Request, res: Response) => {
  try {
    const mailboxId = String(req.params.mailboxId);

    const mailbox = await prisma.mailbox.findUnique({
      where: { mailboxId },
      include: {
        messages: {
          orderBy: { receivedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!mailbox) {
      return res.status(404).json({
        success: false,
        error: 'Mailbox not found',
      });
    }

    const isExpired = new Date() > mailbox.expiresAt;
    if (isExpired && mailbox.active) {
      await prisma.mailbox.update({
        where: { mailboxId },
        data: { active: false },
      });
      mailbox.active = false;
    }

    res.json({
      success: true,
      data: {
        mailboxId: mailbox.mailboxId,
        email: mailbox.email,
        buyer: mailbox.buyer,
        createdAt: mailbox.createdAt,
        expiresAt: mailbox.expiresAt,
        duration: mailbox.duration,
        paymentMethod: mailbox.paymentMethod,
        active: mailbox.active,
        isExpired,
        messageCount: mailbox.messages.length,
        recentMessages: mailbox.messages.map(msg => ({
          from: msg.from,
          subject: msg.subject,
          intro: msg.intro,
          receivedAt: msg.receivedAt,
          seen: msg.seen,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching mailbox:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/mailbox/:mailboxId/messages
 * Get all messages for a mailbox
 */
router.get('/:mailboxId/messages', async (req: Request, res: Response) => {
  try {
    const mailboxId = String(req.params.mailboxId);
    const sync = req.query.sync as string | undefined;

    if (sync === 'true') {
      await mailtmService.syncMessages(mailboxId);
    }

    const messages = await prisma.message.findMany({
      where: { mailboxId },
      orderBy: { receivedAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        mailboxId,
        count: messages.length,
        messages: messages.map(msg => ({
          id: msg.id,
          from: msg.from,
          to: msg.to,
          subject: msg.subject,
          intro: msg.intro,
          hasAttachments: msg.hasAttachments,
          size: msg.size,
          seen: msg.seen,
          receivedAt: msg.receivedAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/mailbox/:mailboxId/sync
 * Manually sync messages from mail.tm
 */
router.post('/:mailboxId/sync', async (req: Request, res: Response) => {
  try {
    const mailboxId = String(req.params.mailboxId);

    const syncedCount = await mailtmService.syncMessages(mailboxId);

    res.json({
      success: true,
      data: {
        mailboxId,
        syncedCount,
        message: `Synced ${syncedCount} messages`,
      },
    });
  } catch (error: any) {
    console.error('Error syncing messages:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/mailbox/:mailboxId/status
 * Check mailbox status (active, expired, etc.)
 */
router.get('/:mailboxId/status', async (req: Request, res: Response) => {
  try {
    const mailboxId = String(req.params.mailboxId);

    const mailbox = await prisma.mailbox.findUnique({
      where: { mailboxId },
    });

    if (!mailbox) {
      return res.status(404).json({
        success: false,
        error: 'Mailbox not found',
      });
    }

    const onChainActive = await blockchainService.isMailboxActive(mailboxId);
    const isExpired = new Date() > mailbox.expiresAt;

    res.json({
      success: true,
      data: {
        mailboxId,
        active: mailbox.active && !isExpired,
        onChainActive,
        isExpired,
        expiresAt: mailbox.expiresAt,
        remainingTime: isExpired ? 0 : mailbox.expiresAt.getTime() - Date.now(),
      },
    });
  } catch (error: any) {
    console.error('Error checking mailbox status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/mailbox/buyer/:address
 * Get all mailboxes for a buyer address
 */
router.get('/buyer/:address', async (req: Request, res: Response) => {
  try {
    const address = String(req.params.address).toLowerCase();

    const mailboxes = await prisma.mailbox.findMany({
      where: {
        buyer: address,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    res.json({
      success: true,
      data: {
        buyer: address,
        count: mailboxes.length,
        mailboxes: mailboxes.map(mb => ({
          mailboxId: mb.mailboxId,
          email: mb.email,
          createdAt: mb.createdAt,
          expiresAt: mb.expiresAt,
          duration: mb.duration,
          paymentMethod: mb.paymentMethod,
          active: mb.active,
          messageCount: mb._count.messages,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching buyer mailboxes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
