import { kafka, TOPIC_NAMES, KAFKA_CONSUMER_GROUP } from '@/data/kafka';
import {
  CreateNodeTransactionInput,
  Transaction,
  UpdateNodeTransactionInput,
} from '@/types/transactions';
import { prisma } from '@/data/prisma';
import { Prisma } from '@prisma/client';

export const initTransactionsConsumer = async () => {
  const consumer = kafka.consumer({ groupId: KAFKA_CONSUMER_GROUP });
  await consumer.connect();

  await consumer.subscribe({ topic: TOPIC_NAMES.TRANSACTIONS });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (message.value === null) return;

      const transaction: Transaction = JSON.parse(message.value.toString());
      await handleTransaction(transaction);
    },
  });
};

const handleTransaction = async (transaction: Transaction) => {
  switch (transaction.type) {
    case 'create_node':
      await handleCreateNodeTransaction(transaction);
      break;
    case 'create_nodes':
      await handleCreateNodesTransaction(transaction);
      break;
    case 'update_node':
      await handleUpdateNodeTransaction(transaction);
      break;
    case 'delete_node':
      await handleDeleteNodeTransaction(transaction);
      break;
    case 'delete_nodes':
      await handleDeleteNodesTransaction(transaction);
      break;
  }
};

const handleCreateNodeTransaction = async (transaction: Transaction) => {
  const input = JSON.parse(transaction.input) as CreateNodeTransactionInput;

  const data: Prisma.nodesUncheckedCreateInput = {
    id: input.id,
    parentId: input.parentId,
    workspaceId: input.workspaceId,
    type: input.type,
    index: input.index,
    createdAt: input.createdAt,
    createdBy: input.createdBy,
    versionId: input.versionId,
  };

  if (input.attrs !== undefined && input.attrs !== null) {
    data.attrs = input.attrs;
  }

  if (input.content !== undefined && input.content !== null) {
    data.content = input.content;
  }

  await prisma.nodes.create({
    data: data,
  });
};

const handleCreateNodesTransaction = async (transaction: Transaction) => {
  const nodes = JSON.parse(transaction.input) as CreateNodeTransactionInput[];
  const data: Prisma.nodesUncheckedCreateInput[] = nodes.map((node) => {
    const data: Prisma.nodesUncheckedCreateInput = {
      id: node.id,
      parentId: node.parentId,
      workspaceId: node.workspaceId,
      type: node.type,
      index: node.index,
      createdAt: node.createdAt,
      createdBy: node.createdBy,
      versionId: node.versionId,
    };

    if (node.attrs !== undefined && node.attrs !== null) {
      data.attrs = node.attrs;
    }

    if (node.content !== undefined && node.content !== null) {
      data.content = node.content;
    }

    return data;
  });

  await prisma.nodes.createMany({
    data: data,
  });
};

const handleUpdateNodeTransaction = async (transaction: Transaction) => {
  const input = JSON.parse(transaction.input) as UpdateNodeTransactionInput;

  const existingNode = await prisma.nodes.findUnique({
    where: {
      id: input.id,
    },
  });

  if (!existingNode) {
    return;
  }

  const data: Prisma.nodesUncheckedUpdateInput = {
    parentId: input.parentId,
    updatedAt: input.updatedAt,
    updatedBy: input.updatedBy,
    versionId: input.versionId,
  };

  if (input.attrs !== undefined) {
    if (input.attrs === null) {
      data.attrs = Prisma.JsonNull;
    } else {
      const existingAttrs =
        existingNode.attrs != null
          ? (existingNode.attrs as Record<string, any>)
          : {};

      const newAttrs = {
        ...existingAttrs,
        ...input.attrs,
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
  await prisma.nodes.delete({
    where: {
      id: transaction.input,
    },
  });
};

const handleDeleteNodesTransaction = async (transaction: Transaction) => {
  const input = JSON.parse(transaction.input) as string[];
  await prisma.nodes.deleteMany({
    where: {
      id: {
        in: input,
      },
    },
  });
};
