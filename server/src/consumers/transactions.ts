import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { NodeTransactionData, Transaction } from '@/types/transactions';
import { prisma } from '@/data/prisma';
import { Prisma } from '@prisma/client';

export const initTransactionsConsumer = async () => {
  const consumer = kafka.consumer({ groupId: CONSUMER_IDS.TRANSACTIONS });
  await consumer.connect();

  await consumer.subscribe({ topic: TOPIC_NAMES.TRANSACTIONS });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (message.value === null) return;

      try {
        const transaction: Transaction = JSON.parse(message.value.toString());
        await handleTransaction(transaction);
      } catch (error) {
        console.error('Error processing transaction:', error);
      }
    },
  });
};

const handleTransaction = async (transaction: Transaction) => {
  switch (transaction.table) {
    case 'nodes':
      await handleNodeTransaction(transaction);
      break;
  }
};

const handleNodeTransaction = async (transaction: Transaction) => {
  switch (transaction.action) {
    case 'insert':
      await handleInsertNodeTransaction(transaction);
      break;
    case 'update':
      await handleUpdateNodeTransaction(transaction);
      break;
    case 'delete':
      await handleDeleteNodeTransaction(transaction);
      break;
  }
};

const handleInsertNodeTransaction = async (transaction: Transaction) => {
  if (!transaction.after) {
    return;
  }

  const input = JSON.parse(transaction.after) as NodeTransactionData;
  const data: Prisma.nodesUncheckedCreateInput = {
    id: input.id,
    parentId: input.parent_id,
    workspaceId: input.workspace_id,
    type: input.type,
    index: input.index,
    createdAt: input.created_at,
    createdBy: input.created_by,
    versionId: input.version_id,
    serverCreatedAt: new Date(),
    serverVersionId: input.version_id,
  };

  if (input.attrs !== undefined && input.attrs !== null) {
    data.attrs = JSON.parse(input.attrs);
  }

  if (input.content !== undefined && input.content !== null) {
    data.content = JSON.parse(input.content);
  }

  await prisma.nodes.create({
    data: data,
  });
};

const handleUpdateNodeTransaction = async (transaction: Transaction) => {
  if (!transaction.after) {
    return;
  }

  const input = JSON.parse(transaction.after) as NodeTransactionData;
  const existingNode = await prisma.nodes.findUnique({
    where: {
      id: input.id,
    },
  });

  if (!existingNode) {
    return;
  }

  const data: Prisma.nodesUncheckedUpdateInput = {
    parentId: input.parent_id,
    updatedAt: input.updated_at,
    updatedBy: input.updated_by,
    versionId: input.version_id,
    serverUpdatedAt: new Date(),
    serverVersionId: input.version_id,
  };

  if (input.attrs !== undefined) {
    if (input.attrs === null) {
      data.attrs = Prisma.JsonNull;
    } else {
      const existingAttrs =
        existingNode.attrs != null
          ? (existingNode.attrs as Record<string, any>)
          : {};

      const updatedAttrs = JSON.parse(input.attrs) as Record<string, any>;
      const newAttrs = {
        ...existingAttrs,
        ...updatedAttrs,
      };

      const hasAttrs = Object.keys(newAttrs).length > 0;
      data.attrs = hasAttrs ? newAttrs : Prisma.JsonNull;
    }
  }

  if (input.content !== undefined) {
    if (input.content === null) {
      data.content = Prisma.JsonNull;
    } else {
      data.content = input.content;
    }
  }

  await prisma.nodes.update({
    where: {
      id: existingNode.id,
    },
    data: data,
  });
};

const handleDeleteNodeTransaction = async (transaction: Transaction) => {
  if (!transaction.before) {
    return;
  }

  const input = JSON.parse(transaction.before) as NodeTransactionData;
  await prisma.nodes.delete({
    where: {
      id: input.id,
    },
  });
};
