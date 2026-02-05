-- CreateTable
CREATE TABLE "Mailbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mailboxId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mailboxId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "intro" TEXT,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "size" INTEGER,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "Mailbox" ("mailboxId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockchainEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "mailboxId" TEXT,
    "buyer" TEXT,
    "expiresAt" DATETIME,
    "paymentMethod" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_mailboxId_key" ON "Mailbox"("mailboxId");

-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_email_key" ON "Mailbox"("email");

-- CreateIndex
CREATE INDEX "Mailbox_mailboxId_idx" ON "Mailbox"("mailboxId");

-- CreateIndex
CREATE INDEX "Mailbox_buyer_idx" ON "Mailbox"("buyer");

-- CreateIndex
CREATE INDEX "Mailbox_email_idx" ON "Mailbox"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Message_messageId_key" ON "Message"("messageId");

-- CreateIndex
CREATE INDEX "Message_mailboxId_idx" ON "Message"("mailboxId");

-- CreateIndex
CREATE INDEX "Message_receivedAt_idx" ON "Message"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainEvent_transactionHash_key" ON "BlockchainEvent"("transactionHash");

-- CreateIndex
CREATE INDEX "BlockchainEvent_transactionHash_idx" ON "BlockchainEvent"("transactionHash");

-- CreateIndex
CREATE INDEX "BlockchainEvent_processed_idx" ON "BlockchainEvent"("processed");

-- CreateIndex
CREATE INDEX "BlockchainEvent_createdAt_idx" ON "BlockchainEvent"("createdAt");
